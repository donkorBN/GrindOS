const sdk = require('node-appwrite');
const { Resend } = require('resend');

module.exports = async function (context) {
    const { req, res, log, error } = context;

    // Required env vars set in Appwrite Console
    const resendApiKey = process.env.RESEND_API_KEY;
    const projectEndpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1';
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    const dbId = 'toxic-planner';
    const settingsColId = 'settings';
    const statsColId = 'stats';

    if (!resendApiKey || !apiKey || !projectId) {
        error('Missing required environment variables.');
        return res.json({ success: false, error: 'Missing environment variables.' }, 500);
    }

    const resend = new Resend(resendApiKey);

    const client = new sdk.Client()
        .setEndpoint(projectEndpoint)
        .setProject(projectId)
        .setKey(apiKey);

    const databases = new sdk.Databases(client);

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isSunday = today.getDay() === 0;

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isLastDayOfMonth = tomorrow.getDate() === 1;

    try {
        log(`[cron-recap] Running for ${todayKey}. isSunday: ${isSunday}, isLastDay: ${isLastDayOfMonth}`);

        // Fetch all users from settings
        const settingsRes = await databases.listDocuments(dbId, settingsColId, [
            sdk.Query.limit(100)
        ]);

        if (settingsRes.total === 0) {
            log('No users/settings found. Exiting.');
            return res.json({ success: true, message: 'No users found.' });
        }

        // Fetch stats for all users (in MVP, there's just 1 user typically)
        const statsRes = await databases.listDocuments(dbId, statsColId, [
            sdk.Query.limit(365),
            sdk.Query.orderDesc('date')
        ]);
        const allStats = statsRes.documents;

        const sentEmails = [];

        for (const userSettings of settingsRes.documents) {
            if (!userSettings.dailyRecapEnabled && !isSunday && !isLastDayOfMonth) {
                log(`Skipping daily recap for ${userSettings.$id} - disabled in settings.`);
                continue;
            }

            const userEmail = userSettings.userId || 'user@example.com';
            if (!userEmail.includes('@')) {
                log(`Invalid email for ${userSettings.$id}: ${userEmail}`);
                continue;
            }

            const todayStat = allStats.find(s => s.date === todayKey) || { totalTasks: 0, completedTasks: 0, executionScore: 0, executionTier: 'Slacking' };

            let subject = `Execution Report [DAILY] - ${todayStat.executionTier}`;
            let htmlBody = `
                <div style="font-family: sans-serif; background-color: #1A1C20; color: #E5E7EB; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #4A90FF; font-weight: 800; margin-bottom: 5px;">Daily Grind Recap</h1>
                    <p style="color: #9CA3AF; font-size: 14px; margin-top: 0;">${todayKey}</p>
                    
                    <div style="background-color: #252830; padding: 24px; border-radius: 12px; margin-top: 30px;">
                        <h2 style="margin: 0; color: #F3F4F6;">Score: <span style="color: #10B981;">${todayStat.executionScore}%</span> (${todayStat.executionTier})</h2>
                        <p style="font-size: 16px; margin-top: 10px;">You planned <b>${todayStat.totalTasks}</b> tasks. You completed <b>${todayStat.completedTasks}</b>.</p>
                    </div>

                    <div style="margin-top: 30px;">
                        ${getToxicRoast(todayStat.executionScore, userSettings.toxicLevel)}
                    </div>
            `;

            if (isSunday) {
                const weekStats = allStats.slice(0, 7);
                const weekAvgScore = weekStats.length ? Math.round(weekStats.reduce((a, b) => a + (b.executionScore || 0), 0) / weekStats.length) : 0;

                subject = `Execution Report [WEEKLY] - Avg Score: ${weekAvgScore}%`;
                htmlBody += `
                    <div style="background-color: #252830; padding: 24px; border-radius: 12px; margin-top: 20px; border-left: 4px solid #A855F7;">
                        <h2 style="margin: 0; color: #A855F7;">Weekly Overview</h2>
                        <p style="font-size: 16px;">7-Day Average Execution: <b>${weekAvgScore}%</b></p>
                        ${weekAvgScore < 60 ? '<p style="color: #EF4444;">A pathetic week. Fix your habits.</p>' : '<p style="color: #10B981;">Solid week. Don\\'t get comfortable.</p > '}
                    </div > `;
            }

            if (isLastDayOfMonth) {
                const monthStats = allStats.slice(0, Math.min(31, allStats.length));
                const monthAvgScore = monthStats.length ? Math.round(monthStats.reduce((a, b) => a + (b.executionScore || 0), 0) / monthStats.length) : 0;
                
                subject = `Execution Report[MONTHLY] - Avg Score: ${ monthAvgScore }% `;
                htmlBody += `
                    < div style = "background-color: #252830; padding: 24px; border-radius: 12px; margin-top: 20px; border-left: 4px solid #EC4899;" >
                        <h2 style="margin: 0; color: #EC4899;">Monthly Overview</h2>
                        <p style="font-size: 16px;">30-Day Average Execution: <b>${monthAvgScore}%</b></p>
                    </div > `;
            }
            
            htmlBody += `
                </div >
                    `;

            try {
                const { data, error: resendError } = await resend.emails.send({
                    from: 'GrindOS Toxicity <onboarding@resend.dev>', // Replace with your domain if configured in resend
                    to: [userEmail],
                    subject: subject,
                    html: htmlBody,
                });

                if (resendError) {
                    error(`Resend failed for ${ userEmail }: `, resendError);
                } else {
                    log(`Sent email to ${ userEmail } `);
                    sentEmails.push(userEmail);
                }
            } catch (e) {
                error(`Failed to send email to ${ userEmail }: `, e);
            }
        }

        return res.json({
            success: true,
            sentCount: sentEmails.length,
            sentTo: sentEmails,
            isWeekly: isSunday,
            isMonthly: isLastDayOfMonth
        });

    } catch (err) {
        error('Error in cron-recap:', err);
        return res.json({ success: false, error: err.message }, 500);
    }
};

function getToxicRoast(score, level) {
    if (score >= 90) return '<p style="font-size: 16px; font-weight: bold; color: #10B981;">Acceptable. Do it again tomorrow.</p>';
    if (score >= 60) {
        return level === 'brutal' 
            ? '<p style="font-size: 16px; font-weight: bold; color: #F59E0B;">Mediocre. You left potential on the table because you are undisciplined.</p>'
            : '<p style="font-size: 16px; font-weight: bold; color: #F59E0B;">You survived the day, but you didn\\'t conquer it.</p>';
    }
    return level === 'brutal'
        ? '<p style="font-size: 16px; font-weight: bold; color: #EF4444;">Absolutely pathetic. You lied to yourself today. If you keep this up, you will fail.</p>'
        : '<p style="font-size: 16px; font-weight: bold; color: #EF4444;">Unacceptable performance. You need to focus.</p>';
}

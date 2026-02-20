import { ToxicLevel } from '@/types/task';


export const WAKE_UP_MESSAGES: Record<ToxicLevel, string[]> = {
  mild: [
    "New day, new chance. Let's make it count.",
    "You showed up. That's already more than most.",
    "Ready to crush today? Let's hear the plan.",
    "Good to see you. Time to get organized.",
  ],
  spicy: [
    "Oh look who finally decided to show up. Let's go.",
    "Another day you almost wasted sleeping. Talk.",
    "Your competition woke up 3 hours ago. What's the plan?",
    "Yesterday you said tomorrow. It's tomorrow. Speak.",
    "Nobody cares about your excuses. What are we doing today?",
    "Average people plan nothing. Prove you're not average.",
  ],
  brutal: [
    "The world didn't wait for you. Start talking or stay losing.",
    "Time is ticking and you're still staring at your phone. Pathetic.",
    "Every second without a plan is a second wasted forever.",
    "Your dreams are dying while you debate whether to get started.",
    "Mediocrity is calling. Don't answer. Tell me the plan. NOW.",
    "While you slept, someone else took your spot. Get moving.",
  ],
};


export const TASK_COMPLETE_MESSAGES: Record<ToxicLevel, string[]> = {
  mild: [
    "Nice work! One down, keep the momentum.",
    "Task done. You're making progress!",
    "Checked off. Every step counts.",
  ],
  spicy: [
    "Finally. One down. Don't celebrate yet.",
    "That's the bare minimum. Keep moving.",
    "Done? Good. Now do the next one.",
    "One less excuse. Keep going.",
  ],
  brutal: [
    "Wow, you actually did something. Shocking.",
    "One task. ONE. Don't act like you won a medal.",
    "Finished? Cool. You're still behind. Move.",
    "That took forever. Next.",
  ],
};


export const ALL_DONE_MESSAGES: Record<ToxicLevel, string[]> = {
  mild: [
    "All tasks done! Great work today.",
    "You crushed it! Take a well-earned break.",
    "Everything checked off. Be proud of yourself.",
  ],
  spicy: [
    "All done. Don't get soft now.",
    "Finished already? Maybe you didn't set enough tasks.",
    "Everything done. Tomorrow better be harder.",
  ],
  brutal: [
    "Done? Those tasks were too easy. Set harder ones.",
    "All clear. Enjoy it. Tomorrow will destroy you.",
    "You finished. Barely. Set the bar higher next time.",
  ],
};


export const SLACKING_MESSAGES: Record<ToxicLevel, string[]> = {
  mild: [
    "Hey, you've got tasks waiting. Let's get back to it.",
    "Just a reminder — you've got things to do.",
    "Your tasks are waiting patiently. Are you?",
  ],
  spicy: [
    "You've been slacking. I can see the unfinished tasks.",
    "Those tasks aren't going to complete themselves.",
    "Still procrastinating? Classic.",
  ],
  brutal: [
    "You're wasting time and you know it.",
    "Every minute you sit here is a minute wasted. Move.",
    "Your task list is judging you. Hard.",
  ],
};


export const EMPTY_DAY_MESSAGES: Record<ToxicLevel, string[]> = {
  mild: [
    "No plans yet? Let's fix that.",
    "A day without plans is a day without purpose. Let's plan.",
    "Ready to start? Tell me what needs to happen today.",
  ],
  spicy: [
    "Empty day? That's a wasted day. Speak.",
    "No tasks? No wonder you're not getting anywhere.",
    "Zero plans. Zero progress. Fix it.",
  ],
  brutal: [
    "NOTHING planned? You're literally choosing to fail.",
    "An empty task list is the sign of a quitter.",
    "No plans means no ambition. Prove me wrong. NOW.",
  ],
};


export function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}


export function getTimeAwareMessage(level: ToxicLevel): string {
  const hour = new Date().getHours();
  if (hour < 6) {
    const earlyMessages: Record<ToxicLevel, string[]> = {
      mild: ["Up early? That's dedication. Let's plan."],
      spicy: ["Up before dawn? You're either dedicated or desperate. Either way, let's go."],
      brutal: ["It's the middle of the night. Either you're grinding or you can't sleep from guilt. Talk."],
    };
    return getRandomMessage(earlyMessages[level]);
  }
  if (hour < 12) {
    return getRandomMessage(WAKE_UP_MESSAGES[level]);
  }
  if (hour < 17) {
    const afternoonMessages: Record<ToxicLevel, string[]> = {
      mild: ["Afternoon check-in. How's the progress?"],
      spicy: ["Half the day is gone. How much have you actually done?"],
      brutal: ["It's afternoon and you're STILL not done? Embarrassing."],
    };
    return getRandomMessage(afternoonMessages[level]);
  }
  const eveningMessages: Record<ToxicLevel, string[]> = {
    mild: ["Evening already. Let's wrap up strong."],
    spicy: ["Day's almost over. Your task list says otherwise."],
    brutal: ["End of day. Your incomplete tasks are screaming at you."],
  };
  return getRandomMessage(eveningMessages[level]);
}
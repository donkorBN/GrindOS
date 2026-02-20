import Colors from '@/constants/colors';
import { useTasks } from '@/providers/TaskProvider';

export function useThemeColors() {
    const { settings } = useTasks();
    const theme: 'dark' | 'light' = settings.theme ?? 'dark';
    return Colors[theme];
}

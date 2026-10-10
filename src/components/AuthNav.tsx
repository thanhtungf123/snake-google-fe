// Sự kiện toàn cục để các component cập nhật ngay sau khi login/logout (không cần F5).
// Giữ ở đây vì nhiều nơi import { AUTH_EVENT } from './AuthNav' (NavClient, NotificationBell,
// AccountClient, AuthForm). Giao diện nav hiện nằm trong NavClient.tsx.
export const AUTH_EVENT = 'gs:auth-changed';

import socketService from '@/services/socket/socketService';

// Export socket instance from socketService
// This provides a singleton socket instance for the application
export const socket = socketService.getSocket();

export default socket;

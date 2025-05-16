

// Interface for Notification Service
interface Notification {
    userId: string;
    title: string;
    message: string;
    type: string;
}
// Mock implementation of notification service 
 export const sendNotification = async (notification: Notification): Promise<void> => {
    console.log('Notification sent:', notification);
    //  actual notification logic 
};
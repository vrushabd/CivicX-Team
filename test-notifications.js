// Test script to create sample notifications
// Run this in the browser console to test notification system

// Create sample notifications for testing
const testNotifications = [
    {
        type: "report_approved",
        title: "Report Approved",
        message: "Your garbage report has been approved and will be processed soon.",
        recipientEmail: "user@civicx.com"
    },
    {
        type: "report_completed",
        title: "Report Completed",
        message: "Your report 'Garbage near park' has been completed!",
        recipientEmail: "user@civicx.com"
    },
    {
        type: "new_report",
        title: "New Report Submitted",
        message: "A new garbage report needs your attention",
        recipientRole: "admin"
    }
];

// Add notifications to localStorage
testNotifications.forEach(notification => {
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    const newNotification = {
        id: Date.now().toString() + Math.random(),
        ...notification,
        createdAt: new Date().toISOString(),
        read: false,
    };
    notifications.unshift(newNotification);
    localStorage.setItem("notifications", JSON.stringify(notifications));
});

console.log("✅ Created 3 test notifications!");
console.log("Refresh your dashboard to see them.");

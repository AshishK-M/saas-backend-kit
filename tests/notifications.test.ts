describe('Notifications Module', () => {
  test('should have notify object defined', () => {
    const { notify } = require('../dist/notifications');
    
    expect(notify).toBeDefined();
    expect(notify.email).toBeDefined();
    expect(notify.sms).toBeDefined();
    expect(notify.webhook).toBeDefined();
    expect(notify.slack).toBeDefined();
  });

  test('should have notification export', () => {
    const { notification } = require('../dist/notifications');
    
    expect(notification).toBeDefined();
    expect(notification.email).toBeDefined();
    expect(notification.sms).toBeDefined();
  });
});

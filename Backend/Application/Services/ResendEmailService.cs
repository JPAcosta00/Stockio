using Microsoft.Extensions.Configuration;
using Resend;

public class ResendEmailService : IEmailService
{
    private readonly IResend _resend;

    public ResendEmailService(IResend resend)
    {
        _resend = resend;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var message = new EmailMessage();
        
        message.From = "onboarding@resend.dev"; 
        
        message.To.Add(toEmail);
        message.Subject = subject;
        message.HtmlBody = htmlBody;

        await _resend.EmailSendAsync(message);
    }
}
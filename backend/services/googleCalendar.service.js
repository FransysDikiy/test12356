const { google } = require('googleapis');

const getOAuthClient = (tokens) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(tokens);
    return oauth2Client;
};

const addEventToCalendar = async (user, reminder, petName) => {
    if (!user.googleTokens) return null;

    const oauth2Client = getOAuthClient(user.googleTokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const now = new Date();
    const [hours, minutes] = reminder.time.split(':');
    now.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const event = {
        summary: `Feed ${petName}`,
        description: `Feeding reminder for ${petName}`,
        start: {
            dateTime: now.toISOString(),
            timeZone: 'UTC',
        },
        end: {
            dateTime: new Date(now.getTime() + 30 * 60000).toISOString(),
            timeZone: 'UTC',
        },
        recurrence:
            reminder.repeat === 'daily'
                ? ['RRULE:FREQ=DAILY']
                : reminder.repeat === 'weekly'
                    ? ['RRULE:FREQ=WEEKLY']
                    : undefined,
    };

    try {
        const result = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });
        return result.data.id;
    } catch (err) {
        console.error('Google Calendar Error:', err.message);
        return null;
    }
};

const deleteCalendarEvent = async (user, eventId) => {
    if (!user.googleTokens || !eventId) return;

    const oauth2Client = getOAuthClient(user.googleTokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        await calendar.events.delete({
            calendarId: 'primary',
            eventId,
        });
    } catch (err) {
        console.warn('Failed to delete Google Calendar event:', err.message);
    }
};

const updateEventInCalendar = async (user, eventId, reminder, petName) => {
    if (!user.googleTokens || !eventId) return;

    const oauth2Client = getOAuthClient(user.googleTokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const now = new Date();
    const [hours, minutes] = reminder.time.split(':');
    now.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const updatedEvent = {
        summary: `Feed ${petName}`,
        description: `Feeding reminder for ${petName}`,
        start: {
            dateTime: now.toISOString(),
            timeZone: 'UTC',
        },
        end: {
            dateTime: new Date(now.getTime() + 30 * 60000).toISOString(),
            timeZone: 'UTC',
        },
        recurrence:
            reminder.repeat === 'daily'
                ? ['RRULE:FREQ=DAILY']
                : reminder.repeat === 'weekly'
                    ? ['RRULE:FREQ=WEEKLY']
                    : undefined,
    };

    try {
        await calendar.events.update({
            calendarId: 'primary',
            eventId,
            resource: updatedEvent,
        });
    } catch (err) {
        console.warn('Failed to update Google Calendar event:', err.message);
    }
};


module.exports = {
    addEventToCalendar,
    deleteCalendarEvent,
    updateEventInCalendar
};


/**
 * Запускати: node events schedule або node events remove для видалення
 */

import uniSchedule from './result.json' with { type: 'json' };
import { google } from "/home/constantine/.nvm/versions/node/v22.14.0/lib/node_modules/googleapis/build/src/index.js";
import { authenticate } from "/home/constantine/.nvm/versions/node/v22.14.0/lib/node_modules/@google-cloud/local-auth/build/src/index.js";
import readline from 'node:readline/promises';

const auth = await authenticate({
	keyfilePath: "credentials.json",
	scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({ version: "v3", auth });

async function schedule() {
	for (const { day, month, classes } of uniSchedule) {
		for (const [summary, clazzes] of Object.entries(classes)) {
			for (const clazz of clazzes) {
				const [name] = summary.split(' | ');
				const dday = day.length == 1 ? '0' + day : day;
				const startHour = clazz.i+8 < 10 ? '0' + (clazz.i + 8) : clazz.i + 8;
				let endHour = clazz.i + 8 + clazz.length;
				if (endHour < 10) endHour = '0' + endHour;

				// CHANGEME: підгрупа
				if (!clazz.subgroup || clazz.subgroup === '1') {
					console.log(`scheduling ${name}\t\t${dday}.${month} ${startHour}:15-${endHour}:00`);
					await calendar.events.insert({
						calendarId: "primary",
						requestBody: {
							summary: name,
							description: clazz.link,
							start: {
								dateTime: `2025-${month}-${dday}T${startHour}:15:00+02:00`,
								timeZone: "Europe/Kiev",
							},
							end: {
								dateTime: `2025-${month}-${dday}T${endHour}:00:00+02:00`,
								timeZone: "Europe/Kiev",
							},
							conferenceData: {
								conferenceId: clazz.link.substring(24),
							},
							reminders: {
								overrides: [
									{
										method: 'popup',
										minutes: 15,
									}
								],
								useDefault: false,
							}
						},
						conferenceDataVersion: 1,
					});
				}
			}
		}
	}
}

async function remove() {
	const dates = uniSchedule.map(s => new Date(2025, s.month - 1, s.day)).sort((a, b) => a.getDate() < b.getDate());

	const response = await calendar.events.list({
		timeMin: dates[0].toISOString(),
		timeMax: dates[dates.length - 1].toISOString(),
		calendarId: 'primary',
		singleEvents: true,
		orderBy: 'startTime',
	});

	const names = uniSchedule.flatMap(e => Object.keys(e.classes)).reduce((set, clazz) => {
		set.add(clazz.split(' | ')[0]);
		return set;
	}, new Set());
	const recentEvents = response.data.items.filter(e => names.has(e.summary));

	if (!recentEvents || recentEvents.length === 0) {
		console.log('No recently created events found.');
		return;
	}

	const rl = readline.createInterface(process.stdin, process.stdout);

	await rl.question(`Found ${recentEvents.length} events. Press Enter to delete or Ctrl+C to cancel.`);

	rl.close();

	for (const event of recentEvents) {
		try {
			await calendar.events.delete({
				calendarId: 'primary',
				eventId: event.id,
			});
		} catch (err) {
			console.error(`failed to delete: ${event.summary}, err: ${err.message}`);
		}
		console.log(`Deleted: ${event.summary}`);
	}
}

try {
	const funcs = { remove, schedule, };

	const func = process.argv[2];
	if (func in funcs) {
		await funcs[func]();
	} else {
		console.error(`Unknown funcs: ${func}`);
		console.error(`Available funcs: ${Object.keys(funcs).join(', ')}`);
	}
} catch (err) {
	console.error(`Error executing func: ${err}`);
}

/**
 * Слід запустити цей скрипт у консолі сторінки розкладу, та скопіювати отримавший масив у result.json
 */

(function () {
	const hints = {
		"Войтко В.В.": "https://meet.google.com/tki-jbsy-ejc",
		"Стахов О.Я.": "https://meet.google.com/oqd-sksc-bju",
		"Хошаба О.М.": "https://meet.google.com/opv-dpof-cmy",
		"Ліщинська Л.Б.": "https://meet.google.com/jes-wczj-whr",
		"Магас Л.М.": "https://meet.google.com/mcj-ymig-dck",
		"Черноволик Г.О.": "https://meet.google.com/wgh-qwyy-kgi",
	};

	const hintx = new RegExp(Object.keys(hints).join("|"));

	const now = new Date();

	return document
		.querySelectorAll("tr:has(:nth-child(16):last-child)")
		.values()
		.map((tr) => [...tr.children])
		.map(parse)
		.filter(
			({ classes, day, month }) =>
				Object.keys(classes).length &&
				new Date(2025, month - 1, day).getTime() >= now.getTime()
		)
		.toArray();

	function parse([date, , ...classes]) {
		const [, day, month] = /(\d+)\.(\d+)/.exec(date.innerText);

		classes = classes
			.entries()
			.filter(([, td]) => td.childNodes.length)
			.map(([i, td]) => {
				[, , text, subgroup] = [...td.childNodes];
				const name = text.data;
				const professor = hintx.exec(name)?.[0];

				return {
					i,
					name: name?.replace(hintx, "")?.trim(),
					professor,
					link: hints[professor],
					subgroup: /(1|2) пг\./.exec(subgroup.innerText)?.[1],
					length: 1,
				};
			});

		classes = Object.groupBy(
			classes,
			({ name, subgroup, professor }) =>
				name + " | " + subgroup + " | " + professor
		);

		classes = Object.fromEntries(
			Object.entries(classes).map(([name, items]) => {
				if (items.length <= 1) return [name, items];

				items.sort((a, b) => a.i - b.i);

				const combined = [items[0]];

				for (let j = 1; j < items.length; j++) {
					const prevItem = combined[combined.length - 1];
					const currentItem = items[j];

					if (currentItem.i === prevItem.i + prevItem.length) {
						prevItem.length += 1;
					} else {
						combined.push(currentItem);
					}
				}

				return [name, combined];
			})
		);

		return { day, month, classes };
	}
})();

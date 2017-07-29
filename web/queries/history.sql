SELECT
	d.downloads
FROM
	downloads AS d
WHERE
	d.package = ? AND
	d.day >= DATE_ADD(NOW(), INTERVAL ? DAY) AND
	d.day < DATE_ADD(NOW(), INTERVAL -1 DAY)
ORDER BY
	d.day ASC;

CREATE TABLE IF NOT EXISTS `packages` (
  `id` bigint(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL DEFAULT '',
  `description` text,
  `version` varchar(50) DEFAULT NULL,
  `keywords` text,
  `lastUpdate` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `PackageName` (`name`),
  KEY `lastUpdate` (`lastUpdate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `downloads` (
  `id` bigint(11) unsigned NOT NULL AUTO_INCREMENT,
  `package` bigint(11) unsigned NOT NULL,
  `downloads` bigint(11) NOT NULL,
  `day` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `DownloadsPerDay` (`package`,`day`),
  CONSTRAINT `package` FOREIGN KEY (`package`) REFERENCES `packages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8;

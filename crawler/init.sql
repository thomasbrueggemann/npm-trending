CREATE TABLE IF NOT EXISTS `packages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL DEFAULT '',
  `description` text,
  `version` varchar(8) DEFAULT NULL,
  `keywords` text,
  `lastUpdate` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `PackageName` (`name`),
  KEY `lastUpdate` (`lastUpdate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `downloads` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `package` int(11) NOT NULL,
  `downloads` int(11) NOT NULL,
  `day` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `package` (`package`),
  CONSTRAINT `package` FOREIGN KEY (`package`) REFERENCES `packages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

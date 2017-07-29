SELECT beta, p.id, p.name, p.description, p.version
  FROM
      (
      SELECT --Sx,Sy,Sxx,Sxy,Syy,N,
        Maxx, Minx, Maxy, Miny,
        ((Sy * Sxx) - (Sx * Sxy))
        / ((N * (Sxx)) - (Sx * Sx)) AS alpha,
        ((N * Sxy) - (Sx * Sy))
        / ((N * Sxx) - (Sx * Sx)) AS beta,
        ((N * Sxy) - (Sx * Sy))
        / SQRT((((N * Sxx) - (Sx * Sx))
                * ((N * Syy - (Sy * Sy)))
               )
              ) AS rho, Package As package
        FROM
          (
          SELECT SUM(UNIX_TIMESTAMP(downloads.day)) AS Sx, SUM(downloads.downloads) AS Sy,
            SUM(UNIX_TIMESTAMP(downloads.day) * UNIX_TIMESTAMP(downloads.day)) AS Sxx,
            SUM(UNIX_TIMESTAMP(downloads.day) * downloads.downloads) AS Sxy,
            SUM(downloads.downloads * downloads.downloads) AS Syy, COUNT(*) AS N,
            MAX(UNIX_TIMESTAMP(downloads.day)) AS Maxx, MIN(UNIX_TIMESTAMP(downloads.day)) AS Minx,
            MAX(downloads.downloads) AS Maxy, MIN(downloads.downloads) AS Miny,
            downloads.package as Package
            FROM downloads WHERE downloads.day > DATE_ADD(NOW(), INTERVAL - 7 DAY) AND downloads.day <= DATE_ADD(NOW(), INTERVAL - 1 DAY) GROUP BY downloads.package ORDER BY downloads.day ASC
          ) sums
      ) AlphaBetaRho
      JOIN packages AS p ON p.id = package
      WHERE beta IS NOT NULL
      ORDER BY beta DESC LIMIT 25;

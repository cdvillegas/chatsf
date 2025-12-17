const fs = require('fs');
const csv = require('csv-parser');

const features = [];

fs.createReadStream('SF_Find_Neighborhoods_20251216.csv')
  .pipe(csv())
  .on('data', (row) => {
    try {
      // Parse the WKT (Well-Known Text) MULTIPOLYGON to GeoJSON
      const wkt = row.the_geom;
      
      // Extract coordinates from MULTIPOLYGON
      const coordsMatch = wkt.match(/MULTIPOLYGON \(\(\((.*?)\)\)\)/);
      if (coordsMatch) {
        const coordsStr = coordsMatch[1];
        const coordPairs = coordsStr.split(', ');
        const coordinates = coordPairs.map(pair => {
          const [lng, lat] = pair.trim().split(' ').map(Number);
          return [lng, lat];
        });

        features.push({
          type: 'Feature',
          properties: {
            name: row.name,
            link: row.link,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
          },
        });
      }
    } catch (err) {
      console.error(`Error parsing row for ${row.name}:`, err.message);
    }
  })
  .on('end', () => {
    const geojson = {
      type: 'FeatureCollection',
      features,
    };

    fs.writeFileSync(
      'src/data/sf-neighborhoods.json',
      JSON.stringify(geojson, null, 2)
    );
    
    console.log(`✅ Converted ${features.length} neighborhoods to GeoJSON`);
  });

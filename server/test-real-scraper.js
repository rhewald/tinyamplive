const cheerio = require('cheerio');

async function testCafeDuNordScraping() {
  try {
    console.log('Testing real Cafe du Nord scraping...');
    
    const response = await fetch('https://cafedunord.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log('HTML structure analysis:');
    console.log('Found table rows:', $('tr').length);
    console.log('Found event-like elements:', $('.event, .show, .listing').length);
    
    // Look for table rows that might contain events
    const events = [];
    $('tr').each((index, element) => {
      const $row = $(element);
      const cellCount = $row.find('td').length;
      
      if (cellCount >= 2) {
        const firstCell = $row.find('td:first-child').text().trim();
        const secondCell = $row.find('td:nth-child(2)').text().trim();
        
        if (firstCell && secondCell && firstCell.match(/\w{3}\s+\d{1,2}\/\d{1,2}/)) {
          console.log(`Found potential event: ${firstCell} | ${secondCell}`);
          events.push({
            date: firstCell,
            title: secondCell
          });
        }
      }
    });
    
    console.log(`Found ${events.length} potential events`);
    return events;
    
  } catch (error) {
    console.error('Scraping error:', error);
    return [];
  }
}

testCafeDuNordScraping().then(events => {
  console.log('Results:', JSON.stringify(events, null, 2));
});
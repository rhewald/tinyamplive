#!/usr/bin/env python3
import requests
import json
from datetime import datetime
import re
from bs4 import BeautifulSoup

def scrape_independent():
    """Scrape The Independent using requests and BeautifulSoup"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get('https://www.theindependentsf.com/', headers=headers, timeout=10)
        if response.status_code != 200:
            return []
            
        soup = BeautifulSoup(response.content, 'html.parser')
        events = []
        
        # Look for event containers
        event_containers = soup.find_all(['div', 'section'], class_=re.compile(r'event|show|listing', re.I))
        
        for container in event_containers[:10]:  # Limit to first 10 found
            title_elem = container.find(['h1', 'h2', 'h3', 'h4', 'a'], text=re.compile(r'\w+'))
            date_elem = container.find(text=re.compile(r'\d{1,2}[\/\-]\d{1,2}|\w+ \d{1,2}'))
            
            if title_elem and date_elem:
                title = title_elem.get_text(strip=True) if hasattr(title_elem, 'get_text') else str(title_elem).strip()
                date_str = date_elem.strip() if isinstance(date_elem, str) else date_elem.get_text(strip=True)
                
                # Basic date parsing
                try:
                    if '/' in date_str:
                        parts = date_str.split('/')
                        if len(parts) >= 2:
                            month, day = parts[0], parts[1]
                            year = datetime.now().year
                            formatted_date = f"{year}-{int(month):02d}-{int(day):02d}"
                            
                            events.append({
                                "artist": title,
                                "date": formatted_date,
                                "venue": "The Independent",
                                "link": "https://www.theindependentsf.com/"
                            })
                except:
                    continue
        
        return events
        
    except Exception as e:
        print(f"Error scraping The Independent: {e}")
        return []

def scrape_bottom_of_hill():
    """Scrape Bottom of the Hill using simple requests"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get('https://www.bottomofthehill.com/calendar.html', headers=headers, timeout=10)
        if response.status_code != 200:
            return []
            
        soup = BeautifulSoup(response.content, 'html.parser')
        events = []
        
        # Look for table rows or event containers
        rows = soup.find_all('tr')
        for row in rows[:20]:  # Limit search
            cells = row.find_all(['td', 'th'])
            if len(cells) >= 2:
                text_content = ' '.join([cell.get_text(strip=True) for cell in cells])
                
                # Look for dates and band names
                date_match = re.search(r'(\w+\s+\d{1,2},?\s+20\d{2})', text_content)
                if date_match and len(text_content) > 20:  # Has substantial content
                    try:
                        date_str = date_match.group(1).replace(',', '')
                        parsed_date = datetime.strptime(date_str, "%B %d %Y")
                        formatted_date = parsed_date.strftime("%Y-%m-%d")
                        
                        # Extract artist name (simple heuristic)
                        artist = text_content.split()[0] if text_content else "Unknown Artist"
                        
                        events.append({
                            "artist": artist,
                            "date": formatted_date,
                            "venue": "Bottom of the Hill",
                            "link": "https://www.bottomofthehill.com/calendar.html"
                        })
                    except:
                        continue
        
        return events
        
    except Exception as e:
        print(f"Error scraping Bottom of the Hill: {e}")
        return []

def scrape_cafe_du_nord():
    """Scrape Cafe du Nord using simple requests"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get('https://cafedunord.com/', headers=headers, timeout=10)
        if response.status_code != 200:
            return []
            
        soup = BeautifulSoup(response.content, 'html.parser')
        events = []
        
        # Look for table rows with event data
        rows = soup.find_all('tr')
        for row in rows:
            cells = row.find_all('td')
            if len(cells) >= 2:
                date_cell = cells[0].get_text(strip=True)
                event_cell = cells[1].get_text(strip=True)
                
                # Match date format like "SAT 1/18"
                date_match = re.match(r'(\w{3})\s+(\d{1,2})\/(\d{1,2})', date_cell)
                if date_match and event_cell and 'Private Event' not in event_cell:
                    try:
                        month, day = date_match.groups()[1], date_match.groups()[2]
                        year = datetime.now().year
                        formatted_date = f"{year}-{int(month):02d}-{int(day):02d}"
                        
                        events.append({
                            "artist": event_cell,
                            "date": formatted_date,
                            "venue": "Cafe du Nord",
                            "link": "https://cafedunord.com/"
                        })
                    except:
                        continue
        
        return events
        
    except Exception as e:
        print(f"Error scraping Cafe du Nord: {e}")
        return []

if __name__ == "__main__":
    import sys
    
    venue = sys.argv[1] if len(sys.argv) > 1 else "all"
    
    if venue == "independent":
        events = scrape_independent()
    elif venue == "bottom":
        events = scrape_bottom_of_hill()
    elif venue == "cafe":
        events = scrape_cafe_du_nord()
    else:
        # Run all scrapers
        events = []
        events.extend(scrape_independent())
        events.extend(scrape_bottom_of_hill())
        events.extend(scrape_cafe_du_nord())
    
    print(json.dumps(events, indent=2))
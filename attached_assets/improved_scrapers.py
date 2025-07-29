#!/usr/bin/env python3
"""
Improved Event Scrapers for SF Music Venues
Supports multiple artists per event and better data extraction
"""

import requests
import json
from datetime import datetime, timedelta
import re
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import time
import random
import os

class EventScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def scrape_independent(self) -> List[Dict]:
        """Scrape The Independent - improved version"""
        try:
            url = "https://www.theindependentsf.com/"
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            events = []
            
            # Look for event listings
            event_containers = soup.find_all(['div', 'article'], class_=re.compile(r'event|show|listing|calendar', re.I))
            
            for container in event_containers:
                # Extract event title
                title_elem = container.find(['h1', 'h2', 'h3', 'h4', 'h5'], class_=re.compile(r'title|name', re.I))
                if not title_elem:
                    title_elem = container.find('a', href=re.compile(r'/event/'))
                
                if not title_elem:
                    continue
                
                title = title_elem.get_text(strip=True)
                if not title or len(title) < 3:
                    continue
                
                # Extract date - look for date patterns in the text
                date_match = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})', title)
                if not date_match:
                    # Look in the container text
                    container_text = container.get_text()
                    date_match = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})', container_text)
                
                if not date_match:
                    continue
                
                try:
                    month, day, year = int(date_match.group(1)), int(date_match.group(2)), int(date_match.group(3))
                    
                    # Handle 2-digit years
                    if year < 100:
                        year += 2000
                    
                    event_date = datetime(year, month, day)
                    
                    # Only include future events
                    if event_date < datetime.now():
                        continue
                    
                    # Extract artists from title (split by common separators)
                    artists = self._extract_artists_from_title(title)
                    
                    events.append({
                        "title": title,
                        "artists": artists,
                        "date": event_date.strftime("%Y-%m-%d"),
                        "venue": "The Independent",
                        "venue_slug": "the-independent",
                        "url": url,
                        "ticket_url": None
                    })
                    
                except Exception as e:
                    print(f"Error parsing date from '{title}': {e}")
                    continue
            
            return events
            
        except Exception as e:
            print(f"Error scraping The Independent: {e}")
            return []
    
    def scrape_bottom_of_hill(self) -> List[Dict]:
        """Scrape Bottom of the Hill - improved version"""
        try:
            url = "https://www.bottomofthehill.com/calendar.html"
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            events = []
            
            # Look for calendar entries
            calendar_entries = soup.find_all(['tr', 'div'], class_=re.compile(r'event|show|calendar', re.I))
            
            for entry in calendar_entries:
                # Extract text content
                text_content = entry.get_text(strip=True)
                if not text_content or len(text_content) < 10:
                    continue
                
                # Look for date patterns
                date_match = re.search(r'(\w+\s+\d{1,2},?\s+20\d{2})', text_content)
                if not date_match:
                    continue
                
                try:
                    date_str = date_match.group(1).replace(',', '')
                    event_date = datetime.strptime(date_str, "%B %d %Y")
                    
                    # Only include future events
                    if event_date < datetime.now():
                        continue
                    
                    # Extract artist names from content
                    # Remove date from text to get artist info
                    artist_text = text_content.replace(date_str, '').strip()
                    artists = self._extract_artists_from_text(artist_text)
                    
                    if not artists:
                        continue
                    
                    events.append({
                        "title": f"{', '.join(artists)} at Bottom of the Hill",
                        "artists": artists,
                        "date": event_date.strftime("%Y-%m-%d"),
                        "venue": "Bottom of the Hill",
                        "venue_slug": "bottom-of-the-hill",
                        "url": url,
                        "ticket_url": None
                    })
                    
                except Exception as e:
                    print(f"Error parsing Bottom of the Hill entry: {e}")
                    continue
            
            return events
            
        except Exception as e:
            print(f"Error scraping Bottom of the Hill: {e}")
            return []
    
    def scrape_cafe_du_nord(self) -> List[Dict]:
        """Scrape Café du Nord - improved version"""
        try:
            url = "https://www.cafedunord.com/"
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            events = []
            
            # Look for event listings
            event_containers = soup.find_all(['div', 'article'], class_=re.compile(r'event|show|listing', re.I))
            
            for container in event_containers:
                # Extract title
                title_elem = container.find(['h1', 'h2', 'h3', 'h4'], class_=re.compile(r'title|name', re.I))
                if not title_elem:
                    continue
                
                title = title_elem.get_text(strip=True)
                if not title or len(title) < 3:
                    continue
                
                # Extract date
                date_match = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})', title)
                if not date_match:
                    continue
                
                try:
                    month, day, year = int(date_match.group(1)), int(date_match.group(2)), int(date_match.group(3))
                    
                    # Handle 2-digit years
                    if year < 100:
                        year += 2000
                    
                    event_date = datetime(year, month, day)
                    
                    # Only include future events
                    if event_date < datetime.now():
                        continue
                    
                    artists = self._extract_artists_from_title(title)
                    
                    events.append({
                        "title": title,
                        "artists": artists,
                        "date": event_date.strftime("%Y-%m-%d"),
                        "venue": "Café du Nord",
                        "venue_slug": "cafe-du-nord",
                        "url": url,
                        "ticket_url": None
                    })
                    
                except Exception as e:
                    print(f"Error parsing Café du Nord date: {e}")
                    continue
            
            return events
            
        except Exception as e:
            print(f"Error scraping Café du Nord: {e}")
            return []
    
    def _extract_artists_from_title(self, title: str) -> List[str]:
        """Extract artist names from event title"""
        if not title:
            return []
        
        # Common separators for multiple artists
        separators = [
            ' w/ ', ' with ', ' + ', ' & ', ' and ', ' featuring ', ' feat. ', ' ft. ',
            ', ', ' / ', ' | ', ' presents ', ' presents: '
        ]
        
        artists = []
        current_title = title
        
        # Split by separators
        for sep in separators:
            if sep in current_title:
                parts = current_title.split(sep)
                artists = [part.strip() for part in parts if part.strip()]
                break
        
        # If no separators found, treat as single artist
        if not artists:
            artists = [title.strip()]
        
        # Clean up artist names
        cleaned_artists = []
        for artist in artists:
            # Remove common prefixes/suffixes
            artist = re.sub(r'^(live|concert|show|performance)\s+', '', artist, flags=re.I)
            artist = re.sub(r'\s+(live|concert|show|performance)$', '', artist, flags=re.I)
            
            if artist and len(artist) > 2:
                cleaned_artists.append(artist)
        
        return cleaned_artists
    
    def _extract_artists_from_text(self, text: str) -> List[str]:
        """Extract artist names from general text"""
        if not text:
            return []
        
        # Look for patterns that indicate artist names
        # This is a simplified approach - could be enhanced with ML
        words = text.split()
        if len(words) < 2:
            return []
        
        # Take first few words as artist name (simple heuristic)
        artist_name = ' '.join(words[:3])  # First 3 words
        return [artist_name.strip()]
    
    def scrape_all_venues(self) -> List[Dict]:
        """Scrape all venues and return combined results"""
        all_events = []
        
        print("Scraping The Independent...")
        independent_events = self.scrape_independent()
        all_events.extend(independent_events)
        time.sleep(random.uniform(1, 3))  # Be respectful
        
        print("Scraping Bottom of the Hill...")
        bth_events = self.scrape_bottom_of_hill()
        all_events.extend(bth_events)
        time.sleep(random.uniform(1, 3))
        
        print("Scraping Café du Nord...")
        cafe_events = self.scrape_cafe_du_nord()
        all_events.extend(cafe_events)
        
        print(f"Total events found: {len(all_events)}")
        return all_events

def main():
    """Main function to run scrapers and save results"""
    scraper = EventScraper()
    events = scraper.scrape_all_venues()
    
    # Save to JSON file in the current directory
    output_file = 'scraped_events.json'
    with open(output_file, 'w') as f:
        json.dump(events, f, indent=2)
    
    print(f"Scraped {len(events)} events and saved to {output_file}")
    
    # Print sample events
    for event in events[:5]:
        print(f"- {event['title']} at {event['venue']} on {event['date']}")
        print(f"  Artists: {', '.join(event['artists'])}")

if __name__ == "__main__":
    main() 
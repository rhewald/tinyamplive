import { spotifyAPI } from './spotify';

async function testSpotifyAPI() {
  console.log('Testing Spotify API integration...');
  
  try {
    // Test with a well-known artist
    console.log('\n--- Testing with Arctic Monkeys ---');
    const arcticMonkeys = await spotifyAPI.enrichArtistWithSpotifyData('Arctic Monkeys');
    console.log('Arctic Monkeys data:', JSON.stringify(arcticMonkeys, null, 2));

    // Test with Luna Moth (our sample artist)
    console.log('\n--- Testing with Luna Moth ---');
    const lunaMoth = await spotifyAPI.enrichArtistWithSpotifyData('Luna Moth');
    console.log('Luna Moth data:', JSON.stringify(lunaMoth, null, 2));

    // Test with Wild Oak (our sample opening act)
    console.log('\n--- Testing with Wild Oak ---');
    const wildOak = await spotifyAPI.enrichArtistWithSpotifyData('Wild Oak');
    console.log('Wild Oak data:', JSON.stringify(wildOak, null, 2));

    // Test direct search
    console.log('\n--- Testing direct search for Radiohead ---');
    const radiohead = await spotifyAPI.searchArtist('Radiohead');
    if (radiohead) {
      console.log('Radiohead found:', {
        name: radiohead.name,
        id: radiohead.id,
        followers: radiohead.followers.total,
        genres: radiohead.genres,
        image: radiohead.images[0]?.url
      });
    } else {
      console.log('Radiohead not found');
    }

  } catch (error) {
    console.error('Spotify API test failed:', error);
  }
}

testSpotifyAPI();
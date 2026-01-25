import { searchOpenSourceHotels } from './opendata.js';

async function test() {
  console.log('Testing Milan search...');
  const results = await searchOpenSourceHotels({ city: 'Milan', country: 'Italy' });
  console.log('Results:', results);
  console.log('Number of results:', results.length);
  if (results.length > 0) {
    console.log('First result:', results[0]);
  }
}

test().catch(console.error);

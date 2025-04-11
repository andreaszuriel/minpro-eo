
export interface FeaturedConcertData {
    title: string;
    artist: string;
    date: string;
    time: string;
    location: string;
    imageUrl: string;
    genre: string;
  }
  
  // Export the array of mock concert data
  export const featuredConcerts: FeaturedConcertData[] = [
    {
      title: "Vans Warped Tour",
      artist: "Various Artists",
      date: "April 15, 2025",
      time: "4:00 PM",
      location: "RFK Campus, Washington",
      imageUrl: "https://i.pinimg.com/1200x/33/9c/20/339c207729a108fa0402c3d9c73f7f75.jpg", // Use actual image paths or a placeholder service
      genre: "Festival"
    },
    {
      title: "WORLD DOMINATION",
      artist: "BAND-MAID",
      date: "April 18, 2025",
      time: "8:00 PM",
      location: "Line Cube Shibuya, Tokyo",
      imageUrl: "https://i.pinimg.com/736x/77/9e/fd/779efdd7ffe4e58169ef71a6b5739855.jpg", // Use actual image paths or a placeholder service
      genre: "Rock"
    },
    {
      title: "Popular MonsTOUR II",
      artist: "Falling In Reverse",
      date: "April 19, 2025",
      time: "7:30 PM",
      location: "Arena Stadium, Chicago",
      imageUrl: "https://i.pinimg.com/1200x/45/73/6f/45736fa59bce05d445a1eda03a28e008.jpg", // Use actual image paths or a placeholder service
      genre: "Punk"
    }
  ];
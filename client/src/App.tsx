import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Compare } from './pages/Compare';
import { PhoneDetails } from './pages/PhoneDetails';
import { Finder } from './pages/Finder';
import { Assistant } from './pages/Assistant';
import { Trending } from './pages/Trending';
import { Wishlist } from './pages/Wishlist';
import { Auth } from './pages/Auth';
import { Admin } from './pages/Admin';

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-accent/30 selection:text-white font-sans antialiased overflow-x-hidden">
          {/* Main Navigation Header */}
          <Navbar />
          
          {/* Main Routing Container */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/phone/:id" element={<PhoneDetails />} />
              <Route path="/finder" element={<Finder />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>

          {/* Platform Footer */}
          <Footer />
        </div>
      </Router>
    </AppProvider>
  );
};

export default App;

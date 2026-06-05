import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-border bg-white px-6 py-10 md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        {/* Brand */}
        <div className="text-center md:text-left">
          <Link to="/" className="text-lg font-bold tracking-tight text-foreground font-sans">
            SMARTPHONE COMPARE<span className="text-secondary font-black font-sans text-sm">.AI</span>
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            Intelligent Mobile Phone Comparison & Decision Platform.
          </p>
        </div>

        {/* Sitemap Links */}
        <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/compare" className="hover:text-foreground transition-colors">Compare Tool</Link>
          <Link to="/finder" className="hover:text-foreground transition-colors">Phone Finder</Link>
          <Link to="/assistant" className="hover:text-foreground transition-colors">AI Advisor</Link>
          <Link to="/trending" className="hover:text-foreground transition-colors">Trending Devices</Link>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl border-t border-border pt-6 text-center text-[10px] text-muted-foreground/80">
        <p>© {new Date().getFullYear()} Smartphone Compare AI Platform. All rights reserved. Hardware benchmark scores are dynamic aggregates calculated using device specifications.</p>
      </div>
    </footer>
  );
};

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('ElderCare Application', () => {
  it('renders the branding title and navigation correctly', () => {
    render(<App />);
    const brandingElements = screen.getAllByText(/ElderCare/i);
    expect(brandingElements.length).toBeGreaterThan(0);
  });

  it('renders the emergency SOS button', () => {
    render(<App />);
    const sosElements = screen.getAllByText(/SOS/i);
    expect(sosElements.length).toBeGreaterThan(0);
  });

  it('renders the core Welcome page headlines', () => {
    render(<App />);
    expect(
      screen.getByText(/Caring for Those Who Cared for Us/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Senior Mode \(One-Tap View\)/i)
    ).toBeInTheDocument();
  });
});

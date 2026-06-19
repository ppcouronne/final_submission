import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Hotel, Compass, DollarSign, ExternalLink, MessageSquare } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const TRIP_START = new Date('2027-04-01');

const searchLinks = [
  {
    category: 'Flights',
    icon: '✈️',
    links: [
      { name: 'Google Flights', url: 'https://www.google.com/travel/flights/search?tfs=CBwQAhopagwIAxIIL2cvMTJ5YzBqEgoyMDI3LTA0LTAxcgwIAxIIL2cvMXBxeDAKGilqDAgDEggvZy8xcHF4MFIKMjAyNy0wNC0zMHIMCAMSCC9nLzEyeWMwago' },
      { name: 'Kayak', url: 'https://www.kayak.com/flights/YUL-MRU/2027-04-01/2027-04-30?sort=bestflight_a' },
      { name: 'Skyscanner', url: 'https://www.skyscanner.com/transport/flights/mtrl/mru/?adults=2&adultsv2=2&cabinclass=economy&children=0&inboundaltsenabled=false&infants=0&outboundaltsenabled=false&preferdirects=false&ref=home&rtn=1' },
      { name: 'Air Canada', url: 'https://www.aircanada.com/en/ca/aco/home.html' },
      { name: 'Air Mauritius', url: 'https://www.airmauritius.com' },
    ],
  },
  {
    category: 'Accommodations',
    icon: '🏨',
    links: [
      { name: 'Booking.com', url: 'https://www.booking.com/searchresults.html?ss=Mauritius&checkin_year=2027&checkin_month=4&checkin_monthday=1&checkout_year=2027&checkout_month=4&checkout_monthday=15&group_adults=2&no_rooms=1' },
      { name: 'Airbnb', url: 'https://www.airbnb.com/s/Mauritius--Mauritius/homes?checkin=2027-04-01&checkout=2027-04-14&adults=2' },
      { name: 'Hotels.com', url: 'https://www.hotels.com/search.do?resolved-location=COUNTRY%3A262990%3AUNKNOWN%3AUNKNOWN&destination-id=262990&q-destination=Mauritius&q-check-in=2027-04-01&q-check-out=2027-04-14&q-rooms=1&q-room-0-adults=2' },
      { name: 'TripAdvisor', url: 'https://www.tripadvisor.com/Hotels-g293816-Mauritius-Hotels.html' },
    ],
  },
  {
    category: 'Activities',
    icon: '🤿',
    links: [
      { name: 'Viator', url: 'https://www.viator.com/Mauritius/d821-ttd' },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/mauritius-l933/' },
      { name: 'TripAdvisor Things to Do', url: 'https://www.tripadvisor.com/Attractions-g293816-Activities-Mauritius.html' },
      { name: 'Airbnb Experiences', url: 'https://www.airbnb.com/s/Mauritius--Mauritius/experiences' },
    ],
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ flights: 0, accommodations: 0, activities: 0, budget: 0 });
  const daysLeft = differenceInDays(TRIP_START, new Date());

  useEffect(() => {
    Promise.all([
      api.get('/flights/'),
      api.get('/accommodations/'),
      api.get('/activities/'),
      api.get('/budget/'),
    ]).then(([f, a, act, b]) => {
      const budgetTotal = b.data.reduce((sum: number, item: any) => sum + item.estimated_amount, 0);
      setStats({
        flights: f.data.length,
        accommodations: a.data.length,
        activities: act.data.filter((a: any) => !a.is_suggestion).length,
        budget: budgetTotal,
      });
    }).catch(() => {});
  }, []);

  const statCards = [
    { label: 'Flights Saved', value: stats.flights, icon: Plane, to: '/flights', color: 'bg-blue-50 text-blue-600' },
    { label: 'Stays Saved', value: stats.accommodations, icon: Hotel, to: '/accommodations', color: 'bg-amber-50 text-amber-600' },
    { label: 'Activities Planned', value: stats.activities, icon: Compass, to: '/activities', color: 'bg-purple-50 text-purple-600' },
    { label: 'Budget Estimated', value: stats.budget > 0 ? `$${stats.budget.toLocaleString()}` : '—', icon: DollarSign, to: '/budget', color: 'bg-teal-50 text-teal-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 text-white p-8">
        <div className="relative z-10">
          <p className="text-teal-300 text-sm font-medium mb-1">Welcome back, {user?.username}!</p>
          <h1 className="text-3xl font-bold mb-1">Montreal → Mauritius</h1>
          <p className="text-teal-200 mb-6">April 2027 — The adventure begins!</p>

          <div className="flex flex-wrap gap-6">
            <div className="bg-white/15 rounded-xl px-6 py-4 text-center">
              <div className="text-4xl font-bold">{daysLeft > 0 ? daysLeft : 0}</div>
              <div className="text-teal-200 text-sm mt-1">days to go</div>
            </div>
            <div className="bg-white/15 rounded-xl px-6 py-4 text-center">
              <div className="text-4xl font-bold">April</div>
              <div className="text-teal-200 text-sm mt-1">2027</div>
            </div>
            <div className="bg-white/15 rounded-xl px-6 py-4 text-center">
              <div className="text-4xl font-bold">26°C</div>
              <div className="text-teal-200 text-sm mt-1">avg in Mauritius</div>
            </div>
          </div>
        </div>
        <div className="absolute right-8 top-8 text-8xl opacity-20 select-none">🏝️</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, to, color }) => (
          <Link
            key={label}
            to={to}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow group"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <div className="text-2xl font-bold text-slate-800">{value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Research Links</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {searchLinks.map(({ category, icon, links }) => (
            <div key={category} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{icon}</span>
                <h3 className="font-semibold text-slate-700">{category}</h3>
              </div>
              <div className="space-y-2">
                {links.map(({ name, url }) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-teal-50 text-sm text-slate-700 hover:text-teal-700 transition-colors group"
                  >
                    <span>{name}</span>
                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Chat CTA */}
      <div className="bg-gradient-to-r from-purple-50 to-teal-50 border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageSquare className="text-purple-600" size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Need planning help?</h3>
            <p className="text-slate-500 text-sm mt-0.5">Chat with your AI travel assistant — it knows all about Mauritius and can help create itineraries, suggest activities, and answer any questions.</p>
          </div>
        </div>
        <Link
          to="/chat"
          className="flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Open Chat
        </Link>
      </div>
    </div>
  );
}

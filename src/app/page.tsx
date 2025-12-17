import MapContainer from '@/components/Map/MapContainer';

export default function Home() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <MapContainer />
    </div>
  );
}

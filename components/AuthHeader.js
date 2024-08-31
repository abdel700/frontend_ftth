import Link from 'next/link';

export default function AuthHeader() {
  return (
    <header className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold text-white">FTTH DASHBOARD</h1>
      <div className="flex space-x-4">
        <Link href="/login" className="text-white hover:underline">Login</Link>
      {/*  <Link href="/signup" className="text-white hover:underline">Sign Up</Link>}*/}
      </div>
    </header>
  );
}

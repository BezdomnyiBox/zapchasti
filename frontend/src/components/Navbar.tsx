import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav>
      <Link to="/client">Client</Link>
      <Link to="/picker">Picker</Link>
    </nav>
  );
}
import {NavBar, NavItem, DropdownMenu} from '../components/NavBar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {

  const router = useRouter();
  function navigateTo(path) {
    router.push(path);
  };

  return (
    <>
      <NavBar>
      </NavBar>

      <div className="title-container">
        <h1>Pay Securely With PaySec</h1>
      </div>
      <div className="page-container">
        <form>
          <div className="form-group">
            <h2>Our Goal</h2>
            <h3>Make transactions anonymously and safely</h3>
          </div>
          <div className="form-group">
            <h2>How</h2>
            <h3>Collateralised payments</h3>
            <h5><Link href={'./create-purchase'} className='info'>Learn More</Link></h5>
          </div>
          <div className="form-group">
            <h2>Currencies</h2>
            <h3>Any ERC20 token</h3>
          </div>
        </form>
        <button onClick={() => navigateTo("/create-purchase")}>Get Started</button>
      </div>
    </>
  );
}
import { useState } from "react";
import { buyTokens, calculateIcoPrice, claimTokens, getIcoInfo } from "../lib/functions.js";
import { NavBar } from "../components/NavBar";
import { useRouter } from 'next/navigation';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import InfoIcon from '../icons/InfoIcon';
import { useEffect } from "react";

export default function BuyPSFTokens() {
    const [amount, setAmount] = useState("");
    const [referer, setReferer] = useState("");
    const [poolETH, setPoolETH] = useState(0n);
    const [poolPSC, setPoolPSC] = useState(0n);
    const [deploymentTime, setDeploymentTime] = useState(0n);
    const [timeLimit, setTimeLimit] = useState(0n);
    const [soldAmount, setSoldAmount] = useState(0n);

    const router = useRouter();
    const navigateTo = (path) => {
        router.push(path);
    };

    const handleSubmit = async () => {
        try {
            const purchaseLogs = await buyTokens(referer, amount);
        } catch (error) {
            console.log(`Error: ${error.message}`);
        }
    }

    async function fetchIcoInfo() {
        try {
            let { poolETH, poolPSC, deploymentTime, timeLimit, soldAmount } = await getIcoInfo();
            setPoolETH(poolETH);
            setPoolPSC(poolPSC);
            setDeploymentTime(deploymentTime);
            setTimeLimit(timeLimit);
            setSoldAmount(soldAmount);
        } catch (error) {
            console.log(`Error: ${error.message}`);
        }
    }

    useEffect(() => {
        fetchIcoInfo();
    }, []);

    return (
        <>
            <NavBar />
            <div className="transaction-bar">
                <button onClick={() => navigateTo("/funding-dashboard")}>Dashboard</button>
                <button className="active" onClick={() => navigateTo("/funding-buy")}>Buy</button>
                <button onClick={() => navigateTo("/funding-claim")}>Claim</button>
            </div>
            <div className="page-container">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(referer, amount)
                }}>
                    <div className="form-group">
                        <label>Amount (ETH)</label>
                        <input
                            placeholder="0"
                            type="number"
                            value={amount}
                            onChange={async (e) => {
                                setAmount(e.target.value)
                            }}
                        />
                    </div>
                    <div className="form-group">
                            <label>Referer</label>
                            <br />
                            <input
                                placeholder="0x1234567890abcdef1234567890abcdef12345678"
                                className="addressInput"
                                type="text"
                                value={referer}
                                onChange={(e) => setReferer(e.target.value)}
                            />
                    </div>
                    <button type="submit">Buy Tokens</button>
                </form>
            </div>
        </>
    );
}
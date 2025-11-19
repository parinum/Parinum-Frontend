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
                <button className="active" onClick={() => navigateTo("/funding-dashboard")}>Dashboard</button>
                <button onClick={() => navigateTo("/funding-buy")}>Buy</button>
                <button onClick={() => navigateTo("/funding-claim")}>Claim</button>
            </div>
            <div className="page-container">
                <form className="grid-container">
                    <div className="grid-item">
                        <label>PSC Sold</label>
                        <h2>{soldAmount.toString()}</h2>
                    </div>
                    <div className="grid-item">
                        <label>Time Left</label>
                        <h2>
                            {(() => {
                                const secondsLeft = deploymentTime + timeLimit - BigInt(Math.floor(Date.now() / 1000));
                                const days = secondsLeft / BigInt(86400);
                                const hours = (secondsLeft % BigInt(86400)) / BigInt(3600);
                                return `${days}d ${hours}h`;
                            })()}
                        </h2>
                    </div>
                    <div className="grid-item">
                        <label>PSC Left</label>
                        <h2>{poolPSC.toString()}</h2>
                    </div>
                    <div className="grid-item">
                        <label>ETH Raised</label>
                        <h2>{poolETH.toString()}</h2>
                    </div>
                </form>
            </div>
        </>
    );
}
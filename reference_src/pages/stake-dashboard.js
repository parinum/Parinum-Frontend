import { useState, useEffect } from "react";
import { initProvider, claimRewardsandResetStake, claimRewardsandWithdrawStake, getStakeInfo } from "../lib/functions.js";
import { NavBar } from "../components/NavBar";
import { useRouter } from 'next/navigation';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';


export default function WithdrawDividend() {
  const router = useRouter();
  const navigateTo = (path) => {
    router.push(path);
  };

  const [totalStake, setTotalStake] = useState("0");
  const [availableStake, setAvailableStake] = useState("0");
  const [totalReward, setTotalReward] = useState("0");
  const [availableReward, setAvailableReward] = useState("0");
  const [stakeTime, setStakeTime] = useState(0);
  const [multiplier, setMultiplier] = useState("1.00");
  const [stakeAmount, setStakeAmount] = useState("");

  async function fetchInfo() {
    try {
      let { totalAmount, totalRewardAmount, availableAmount, availableRewardAmount } = await getStakeInfo();
      setTotalStake(totalAmount);
      setTotalReward(totalRewardAmount);
      setAvailableStake(availableAmount);
      setAvailableReward(availableRewardAmount);
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  };

  // Function to calculate multiplier based on stake time
  const calculateMultiplier = (stakeTimeValue) => {
    const timeIncentive = 0.05;
    // Ensure timeIncentive is defined and greater than 0    
    // Formula: 1 + (timeIncentive * stakeTime / 2592000)
    // 2592000 = 30 days in seconds
    const multiplierValue = 1 + (timeIncentive * stakeTimeValue / 2592000);
    return multiplierValue.toFixed(2);
  };

  // Update multiplier when stake time changes
  const handleStakeTimeChange = (value) => {
    setStakeTime(value);
    setMultiplier(calculateMultiplier(Number(value)));
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  // Update multiplier when timeIncentive changes
  useEffect(() => {
    setMultiplier(calculateMultiplier(Number(stakeTime * 2592000))); // Assuming timeIncentive is 0.05
  }, [stakeTime]);

  const handleClaimRewardsandResetStake = async () => {
    try {
      await initProvider();
      await claimRewardsandResetStake(stakeTime);
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  };

  const handleClaimRewardsandWithdrawStake = async () => {
    try {
      await initProvider();
      await claimRewardsandWithdrawStake();
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <NavBar />
      <div className="transaction-bar">
        <button className="active" onClick={() => navigateTo("/stake-dashboard")}>Dashboad</button>
        <button onClick={() => navigateTo("/create-stake")}>Create Stake</button>
        <button onClick={() => navigateTo("/withdraw-dividend")}>Withdraw</button>
      </div>
      <div className="page-container">
        <button onClick={fetchInfo}>Refresh</button>
      </div>
      <div className="page-container">
        <form className="grid-container">
          <div className="grid-item">
            <label>Total Stake</label>
            <h2>{totalStake}</h2>
          </div>
          <div className="grid-item">
            <label>Total Rewards</label>
            <h2>{totalReward}</h2>
          </div>
          <div className="grid-item">
            <label>Available Stake</label>
            <h2>{availableStake}</h2>
          </div>
          <div className="grid-item">
            <label>Available Reward</label>
            <h2>{availableReward}</h2>
          </div>
        </form>
      </div>
    </>
  );
}
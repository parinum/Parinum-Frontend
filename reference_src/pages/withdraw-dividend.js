import { useState, useEffect } from "react";
import { initProvider, claimRewardsandResetStake, claimRewardsandWithdrawStake, getStakeInfo, getStakeInfoByIndex } from "../lib/functions.js";
import { NavBar } from "../components/NavBar";
import { useRouter } from 'next/navigation';
import { Tooltip } from 'react-tooltip';
import InfoIcon from '../icons/InfoIcon';
import 'react-tooltip/dist/react-tooltip.css';
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
  const [stakeTime, setStakeTime] = useState("0");
  const [multiplier, setMultiplier] = useState("1.00");

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

  useEffect(() => {
    fetchInfo();
  }, []);

  const calculateMultiplier = (stakeTimeValue) => {
    const timeIncentive = 0.05;
    // Ensure timeIncentive is defined and greater than 0    
    // Formula: 1 + (timeIncentive * stakeTime / 2592000)
    // 2592000 = 30 days in seconds
    const multiplierValue = 1 + (timeIncentive * stakeTimeValue);
    return multiplierValue.toFixed(2);
  };

  const handleStakeTimeChange = async (value) => {
    setStakeTime(value);
    setMultiplier(calculateMultiplier(Number(value)));
  };

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
        <button onClick={() => navigateTo("/stake-dashboard")}>Dashboad</button>
        <button onClick={() => navigateTo("/create-stake")}>Create Stake</button>
        <button className="active" onClick={() => navigateTo("/withdraw-dividend")}>Withdraw</button>
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
        <button onClick={handleClaimRewardsandWithdrawStake}>Withdraw All</button>
      </div>
      <div className="page-container">
        <form className="grid-container">
          <div className="grid-item">
            <label>
              Stake Time (in months)
              <span
                data-tooltip-id="release-info"
                data-tooltip-content="The time in seconds after which the stake can be released."
                style={{ marginLeft: '8px', cursor: 'pointer' }}
              >
                <InfoIcon />
              </span>
            </label>
            <br />
            <input
              type="number"
              value={stakeTime}
              onChange={(e) => handleStakeTimeChange(e.target.value)} // Convert months to seconds
            />
            <Tooltip id="release-info" />
          </div>
          <div className="grid-item">
            <label>Multiplier</label>
            <h2>{multiplier}</h2>
          </div>
        </form>
        <button onClick={handleClaimRewardsandResetStake}>Withdraw Rewards and Reset Stake</button>
      </div>
    </>
  );
}
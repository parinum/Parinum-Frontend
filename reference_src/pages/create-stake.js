import { useState, useEffect } from "react";
import { initProvider, claimRewardsandResetStake, claimRewardsandWithdrawStake, getStakeInfo } from "../lib/functions.js";
import { NavBar } from "../components/NavBar";
import { useRouter } from 'next/navigation';
import { Tooltip } from 'react-tooltip';
import InfoIcon from '../icons/InfoIcon';
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
  const [stakeAmount, setStakeAmount] = useState("0");

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
        <button onClick={() => navigateTo("/stake-dashboard")}>Dashboad</button>
        <button className="active" onClick={() => navigateTo("/create-stake")}>Create Stake</button>
        <button onClick={() => navigateTo("/withdraw-dividend")}>Withdraw</button>
      </div>
      <div className="page-container">
        <button onClick={fetchInfo}>Refresh</button>
      </div>
      <div className="page-container">
        <form className="grid-container">
          <div className="grid-item">
            <label>
              Stake Time (in months)
              <span
                data-tooltip-id="release-info"
                data-tooltip-content="The time in months after which the stake can be released, and rewards can be withdrawn."
                style={{ marginLeft: '8px', cursor: 'pointer' }}
              >
                <InfoIcon />
              </span>
            </label>
            <br />
            <input
              type="number"
              value={stakeTime}
              onChange={(e) => handleStakeTimeChange(e.target.value)}
            />
            <Tooltip id="release-info" />
          </div>
          <div className="grid-item">
            <label>
              Multiplier
              <span
                data-tooltip-id="multiplier-tooltip"
                data-tooltip-content="Reward multiplier based on stake time. Longer stakes earn higher rewards. Formula: 1 + (timeIncentive × stakeTime ÷ 30 days)."
                style={{ marginLeft: '8px', cursor: 'pointer' }}
              >
                <InfoIcon />
              </span>
            </label>
            <h2>{multiplier}x</h2>
            <Tooltip id="multiplier-tooltip" />
          </div>
        </form>
        <div className="form-group">
            <label>
                Stake Amount
                <span
                    data-tooltip-id="release-info"
                    data-tooltip-content="The amount of PSC tokens to stake."
                    style={{ marginLeft: '8px', cursor: 'pointer' }}
                >
                    <InfoIcon />
                </span>
            </label>
            <br />
            <input
                type="text"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
            />
            <Tooltip id="release-info" />
        </div>
        <button onClick={handleClaimRewardsandResetStake}>Create New Stake</button>
      </div>
    </>
  );
}
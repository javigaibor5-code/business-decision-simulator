// ---------------------------------------------
// Business Decision Simulator - Core logic
// Portfolio project by Frank Gaibor
// ---------------------------------------------

const priceInput = document.getElementById('price');
const variableCostInput = document.getElementById('variableCost');
const fixedCostsInput = document.getElementById('fixedCosts');
const unitsSoldInput = document.getElementById('unitsSold');
const growthRateInput = document.getElementById('growthRate');

const breakEvenUnitsEl = document.getElementById('breakEvenUnits');
const contributionMarginEl = document.getElementById('contributionMargin');
const netProfitEl = document.getElementById('netProfit');
const profitMarginEl = document.getElementById('profitMargin');
const statusBanner = document.getElementById('statusBanner');

let breakEvenChart;
let projectionChart;

function getInputs() {
  return {
    price: parseFloat(priceInput.value) || 0,
    variableCost: parseFloat(variableCostInput.value) || 0,
    fixedCosts: parseFloat(fixedCostsInput.value) || 0,
    unitsSold: parseFloat(unitsSoldInput.value) || 0,
    growthRate: parseFloat(growthRateInput.value) || 0,
  };
}

function calculate() {
  const { price, variableCost, fixedCosts, unitsSold, growthRate } = getInputs();

  const contributionMargin = price - variableCost;
  const breakEvenUnits = contributionMargin > 0 ? fixedCosts / contributionMargin : Infinity;

  const totalRevenue = price * unitsSold;
  const totalVariableCost = variableCost * unitsSold;
  const totalCost = fixedCosts + totalVariableCost;
  const netProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    price,
    variableCost,
    fixedCosts,
    unitsSold,
    growthRate,
    contributionMargin,
    breakEvenUnits,
    totalRevenue,
    totalCost,
    netProfit,
    profitMargin,
  };
}

function updateSummary(results) {
  const { contributionMargin, breakEvenUnits, netProfit, profitMargin, unitsSold } = results;

  breakEvenUnitsEl.textContent = isFinite(breakEvenUnits)
    ? Math.ceil(breakEvenUnits)
    : '—';
  contributionMarginEl.textContent = `$${contributionMargin.toFixed(2)}`;
  netProfitEl.textContent = `$${netProfit.toFixed(2)}`;
  profitMarginEl.textContent = `${profitMargin.toFixed(1)}%`;

  if (contributionMargin <= 0) {
    statusBanner.textContent =
      '⚠️ Your price per unit does not cover the variable cost. You will never break even with these numbers.';
    statusBanner.classList.add('status-banner--warning');
  } else if (unitsSold < breakEvenUnits) {
    statusBanner.textContent = `⚠️ At your expected sales volume, you're below the break-even point. You need ${Math.ceil(
      breakEvenUnits
    )} units/month just to cover costs.`;
    statusBanner.classList.add('status-banner--warning');
  } else {
    statusBanner.textContent = `✅ You're above break-even. At this volume, you're generating a positive monthly profit.`;
    statusBanner.classList.remove('status-banner--warning');
  }
}

function updateBreakEvenChart(results) {
  const { price, variableCost, fixedCosts, breakEvenUnits, unitsSold } = results;

  const maxUnits = Math.max(unitsSold, isFinite(breakEvenUnits) ? breakEvenUnits : 0) * 1.5 || 100;
  const steps = 10;
  const stepSize = maxUnits / steps;

  const labels = [];
  const revenueData = [];
  const costData = [];

  for (let i = 0; i <= steps; i++) {
    const units = Math.round(stepSize * i);
    labels.push(units);
    revenueData.push(units * price);
    costData.push(fixedCosts + units * variableCost);
  }

  const ctx = document.getElementById('breakEvenChart');

  if (breakEvenChart) breakEvenChart.destroy();

  breakEvenChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Revenue',
          data: revenueData,
          borderColor: '#c9a24b',
          backgroundColor: 'rgba(201, 162, 75, 0.1)',
          tension: 0.2,
        },
        {
          label: 'Total Cost',
          data: costData,
          borderColor: '#c9634b',
          backgroundColor: 'rgba(201, 99, 75, 0.1)',
          tension: 0.2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#eef1f4' } },
      },
      scales: {
        x: {
          title: { display: true, text: 'Units sold', color: '#9fb2c6' },
          ticks: { color: '#9fb2c6' },
          grid: { color: 'rgba(238,241,244,0.06)' },
        },
        y: {
          title: { display: true, text: 'Dollars ($)', color: '#9fb2c6' },
          ticks: { color: '#9fb2c6' },
          grid: { color: 'rgba(238,241,244,0.06)' },
        },
      },
    },
  });
}

function updateProjectionChart(results) {
  const { price, variableCost, fixedCosts, unitsSold, growthRate } = results;

  const months = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'];
  const profitData = [];

  let currentUnits = unitsSold;
  for (let i = 0; i < 6; i++) {
    const revenue = currentUnits * price;
    const cost = fixedCosts + currentUnits * variableCost;
    profitData.push(revenue - cost);
    currentUnits = currentUnits * (1 + growthRate / 100);
  }

  const ctx = document.getElementById('projectionChart');

  if (projectionChart) projectionChart.destroy();

  projectionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Net profit',
          data: profitData,
          backgroundColor: profitData.map((v) =>
            v >= 0 ? 'rgba(75, 157, 127, 0.7)' : 'rgba(201, 99, 75, 0.7)'
          ),
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: '#9fb2c6' },
          grid: { display: false },
        },
        y: {
          title: { display: true, text: 'Net profit ($)', color: '#9fb2c6' },
          ticks: { color: '#9fb2c6' },
          grid: { color: 'rgba(238,241,244,0.06)' },
        },
      },
    },
  });
}

function render() {
  const results = calculate();
  updateSummary(results);
  updateBreakEvenChart(results);
  updateProjectionChart(results);
}

[priceInput, variableCostInput, fixedCostsInput, unitsSoldInput, growthRateInput].forEach(
  (input) => input.addEventListener('input', render)
);

render();

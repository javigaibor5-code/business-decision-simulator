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

  const points = [];
  for (let i = 0; i <= steps; i++) {
    const units = stepSize * i;
    points.push({
      units,
      revenue: units * price,
      cost: fixedCosts + units * variableCost,
    });
  }

  const width = 700;
  const height = 260;
  const marginLeft = 60;
  const marginRight = 20;
  const marginTop = 20;
  const marginBottom = 36;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const maxValue = Math.max(...points.map((p) => Math.max(p.revenue, p.cost))) * 1.1 || 1;

  const xScale = (units) => marginLeft + (units / maxUnits) * plotWidth;
  const yScale = (value) => marginTop + plotHeight - (value / maxValue) * plotHeight;

  const revenuePoints = points.map((p) => `${xScale(p.units)},${yScale(p.revenue)}`).join(' ');
  const costPoints = points.map((p) => `${xScale(p.units)},${yScale(p.cost)}`).join(' ');

  const breakEvenX = isFinite(breakEvenUnits) && breakEvenUnits <= maxUnits ? xScale(breakEvenUnits) : null;
  const breakEvenY = breakEvenX !== null ? yScale(breakEvenUnits * price) : null;

  const svg = `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
      <line x1="${marginLeft}" y1="${marginTop}" x2="${marginLeft}" y2="${marginTop + plotHeight}" stroke="#2a3f57" stroke-width="1" />
      <line x1="${marginLeft}" y1="${marginTop + plotHeight}" x2="${width - marginRight}" y2="${marginTop + plotHeight}" stroke="#2a3f57" stroke-width="1" />

      <text x="${marginLeft - 10}" y="${marginTop + 4}" fill="#9fb2c6" font-size="11" text-anchor="end">$${Math.round(maxValue).toLocaleString()}</text>
      <text x="${marginLeft - 10}" y="${marginTop + plotHeight}" fill="#9fb2c6" font-size="11" text-anchor="end">$0</text>
      <text x="${marginLeft}" y="${height - 8}" fill="#9fb2c6" font-size="11">0</text>
      <text x="${width - marginRight}" y="${height - 8}" fill="#9fb2c6" font-size="11" text-anchor="end">${Math.round(maxUnits)} units</text>

      <polyline points="${costPoints}" fill="none" stroke="#c9634b" stroke-width="2.5" />
      <polyline points="${revenuePoints}" fill="none" stroke="#c9a24b" stroke-width="2.5" />

      ${
        breakEvenX !== null
          ? `<line x1="${breakEvenX}" y1="${marginTop}" x2="${breakEvenX}" y2="${marginTop + plotHeight}" stroke="#eef1f4" stroke-width="1" stroke-dasharray="4 4" opacity="0.4" />
             <circle cx="${breakEvenX}" cy="${breakEvenY}" r="4.5" fill="#eef1f4" />`
          : ''
      }

      <rect x="${marginLeft}" y="${marginTop - 4}" width="10" height="10" fill="#c9a24b" />
      <text x="${marginLeft + 16}" y="${marginTop + 5}" fill="#eef1f4" font-size="12">Total Revenue</text>
      <rect x="${marginLeft + 130}" y="${marginTop - 4}" width="10" height="10" fill="#c9634b" />
      <text x="${marginLeft + 146}" y="${marginTop + 5}" fill="#eef1f4" font-size="12">Total Cost</text>
    </svg>
  `;

  document.getElementById('breakEvenChart').innerHTML = svg;
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

  const width = 700;
  const height = 240;
  const marginLeft = 60;
  const marginRight = 20;
  const marginTop = 20;
  const marginBottom = 36;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const maxAbs = Math.max(...profitData.map((v) => Math.abs(v))) * 1.15 || 1;
  const zeroY = marginTop + plotHeight / 2;
  const barWidth = (plotWidth / months.length) * 0.6;
  const slot = plotWidth / months.length;

  const bars = profitData
    .map((value, i) => {
      const barHeight = (Math.abs(value) / maxAbs) * (plotHeight / 2);
      const x = marginLeft + slot * i + (slot - barWidth) / 2;
      const y = value >= 0 ? zeroY - barHeight : zeroY;
      const color = value >= 0 ? '#4b9d7f' : '#c9634b';
      const labelY = value >= 0 ? y - 8 : y + barHeight + 16;

      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="${color}" opacity="0.85" />
        <text x="${x + barWidth / 2}" y="${labelY}" fill="#eef1f4" font-size="11" text-anchor="middle">$${Math.round(value).toLocaleString()}</text>
        <text x="${x + barWidth / 2}" y="${height - 8}" fill="#9fb2c6" font-size="11" text-anchor="middle">${months[i].replace('Month ', 'M')}</text>
      `;
    })
    .join('');

  const svg = `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
      <line x1="${marginLeft}" y1="${zeroY}" x2="${width - marginRight}" y2="${zeroY}" stroke="#2a3f57" stroke-width="1" />
      ${bars}
    </svg>
  `;

  document.getElementById('projectionChart').innerHTML = svg;
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

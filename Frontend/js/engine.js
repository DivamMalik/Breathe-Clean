/* Breathe Clean - Centralized Autonomous Decision Engine */

const Engine = {
  decide(environment, room, devices = []) {
    const outdoorAQI = Number(environment.outdoorAQI || 0);
    const indoorAQI = Number(environment.indoorAQI || 0);
    const co2 = Number(environment.co2 || 0);
    const temp = Number(environment.temperature || 22);
    const humidity = Number(environment.humidity || 50);
    const occupancy = Number(environment.occupancy || 1);

    let targetWindow = 'Closed';
    let targetVentilation = 'Normal';
    let targetPurifier = 'Active';
    let title = '';
    let reason = '';
    let action = '';
    let expectedOutcome = '';
    let statusLevel = 'good';

    // Rule 1: Hazardous outdoor pollution shield (Outdoor AQI > 150)
    if (outdoorAQI > 150) {
      targetWindow = 'Closed';
      targetVentilation = 'Filtered';
      targetPurifier = 'High';
      statusLevel = 'poor';
      title = 'Windows remain sealed due to hazardous outdoor smog.';
      reason = `Outdoor AQI has reached ${outdoorAQI} (Poor). Complete physical boundary isolation is active to block particulate influx.`;
      action = `Smart windows sealed. Ventilation in sealed filtered mode. Air purifier boosted to High CADR speed.`;
      expectedOutcome = `Protect occupants by scrubbing indoor air while completely blocking external toxic particulates.`;
    }
    // Rule 2: Elevated outdoor pollution barrier (Outdoor AQI between 101 and 150)
    else if (outdoorAQI >= 101) {
      targetWindow = 'Closed';
      targetVentilation = (co2 > 1000) ? 'Filtered' : 'Normal';
      targetPurifier = (indoorAQI > 70) ? 'High' : 'Active';
      statusLevel = 'elevated';
      title = 'Windows remain closed because outdoor air quality is elevated.';
      reason = `Outdoor AQI is ${outdoorAQI}, which is elevated. Keeping windows closed prevents outdoor pollutants from entering.`;
      action = `Purifier is running at ${targetPurifier === 'High' ? 'high' : 'normal'} mode. Ventilation is running at ${targetVentilation.toLowerCase()} rate.`;
      expectedOutcome = `Maintain cleaner indoor air while avoiding outdoor pollutants.`;
    }
    // Rule 3: Indoor CO2 Spike with clean outdoor air (Outdoor AQI <= 65, CO2 > 950)
    else if (outdoorAQI <= 65 && co2 > 950) {
      targetWindow = 'Open';
      targetVentilation = 'High';
      targetPurifier = 'Standby';
      statusLevel = 'moderate';
      title = 'Smart windows opened to flush elevated indoor CO₂.';
      reason = `Indoor CO₂ reached ${co2} ppm with ${occupancy} occupant${occupancy > 1 ? 's' : ''}, while outdoor air is clean (AQI ${outdoorAQI}).`;
      action = `Smart windows opened for natural airflow. Ventilation set to High. Purifier switched to Standby to conserve energy.`;
      expectedOutcome = `Displace stuffy indoor CO₂ with fresh oxygenated outdoor air rapidly.`;
    }
    // Rule 4: High Indoor Particulates with Moderate Outdoor (Indoor AQI >= 90)
    else if (indoorAQI >= 90) {
      targetWindow = (outdoorAQI < 45) ? 'Open' : 'Closed';
      targetVentilation = 'Filtered';
      targetPurifier = 'High';
      statusLevel = 'elevated';
      title = 'Purifier boosted to maximum CADR due to indoor air spike.';
      reason = `Indoor AQI elevated to ${indoorAQI}. Localized particulates detected inside the ${room ? room.name : 'space'}.`;
      action = `Air purifier ramped to High speed. Ventilation operating with continuous filtration.`;
      expectedOutcome = `Extract indoor VOCs and particulates to restore healthy baseline within 12 minutes.`;
    }
    // Rule 5: Pure Clean Equilibrium (Both indoor and outdoor AQI <= 50, CO2 <= 800)
    else if (outdoorAQI <= 50 && indoorAQI <= 45 && co2 <= 800) {
      targetWindow = (temp >= 19 && temp <= 27) ? 'Open' : 'Closed';
      targetVentilation = 'Low';
      targetPurifier = 'Active';
      statusLevel = 'good';
      title = 'Air quality is healthy across all environmental metrics.';
      reason = `Outdoor AQI (${outdoorAQI}), indoor AQI (${indoorAQI}), and CO₂ (${co2} ppm) are well within optimal thresholds.`;
      action = `Smart windows ${targetWindow.toLowerCase()}. Air purifier running at whisper-quiet baseline. Ventilation at eco low.`;
      expectedOutcome = `Preserve fresh indoor environment while minimizing device power consumption.`;
    }
    // Default Rule: Standard balanced automation
    else {
      targetWindow = (outdoorAQI < 60 && co2 > 800) ? 'Open' : 'Closed';
      targetVentilation = 'Normal';
      targetPurifier = 'Active';
      statusLevel = (indoorAQI > 50 || outdoorAQI > 80) ? 'moderate' : 'good';
      title = 'Balanced ventilation active for steady air renewal.';
      reason = `Outdoor AQI is ${outdoorAQI} (${Utils.getAqiStatus(outdoorAQI).label}) and indoor AQI is ${indoorAQI} (${Utils.getAqiStatus(indoorAQI).label}).`;
      action = `Smart windows ${targetWindow.toLowerCase()}. Ventilation at normal circulation. Purifier active at standard mode.`;
      expectedOutcome = `Maintain stable air changes per hour and prevent particulate accumulation.`;
    }

    return {
      window: targetWindow,
      ventilation: targetVentilation,
      purifier: targetPurifier,
      title,
      reason,
      action,
      expectedOutcome,
      statusLevel,
      timestamp: new Date().toISOString()
    };
  }
};

import React, { useState, useEffect } from 'react';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import TopHeader from './components/layout/TopHeader';
import AppFooter from './components/layout/AppFooter';

// View Components
import DashboardView from './components/views/DashboardView';
import LiveRoomView from './components/views/LiveRoomView';
import AirQualityMapView from './components/views/AirQualityMapView';
import AnalyticsView from './components/views/AnalyticsView';
import MasterControlsView from './components/views/MasterControlsView';
import AutomationView from './components/views/AutomationView';

// Modals & Gateway Screens
import AuthScreen from './components/AuthScreen';
import SetupWizard from './components/SetupWizard';
import UserSettingsModal from './components/UserSettingsModal';
import SimulationModal from './components/SimulationModal';
import NotificationModal from './components/NotificationModal';

// Constants & Services
import { INITIAL_CHART_DATA, INITIAL_NOTIFICATIONS, INITIAL_ACTIVITIES } from './constants/mockData';
import { fetchLiveEnvironmentalData } from './services/airQualityApi';

// Static Assets
import classroomImg from './assets/classroom.jpg';
import libraryImg from './assets/library.jpg';

export default function App() {
  // Theme state: light or dark
  const [theme, setTheme] = useState('light');

  // Authentication State: null if not logged in (Requirement 1)
  const [currentUser, setCurrentUser] = useState(null);

  // Navigation: 'dashboard' | 'room' | 'air' | 'analytics' | 'controls' | 'automation' | 'setup'
  const [activeNav, setActiveNav] = useState('dashboard');

  // Control Mode: 'auto' (AI adjusted) or 'manual'
  const [controlMode, setControlMode] = useState('auto');

  // Setup Mode Active State (Requirement 5: triggered when user signs up for first time)
  const [isSetupActive, setIsSetupActive] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Room / Space Selection
  const [currentRoom, setCurrentRoom] = useState('Classroom 301');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Live Environmental Data from real API (Requirement 4)
  const [outdoorAQI, setOutdoorAQI] = useState(55);
  const [indoorAQI, setIndoorAQI] = useState(40);
  const [co2Level, setCo2Level] = useState(620);
  const [temperature, setTemperature] = useState(24);
  const [humidity, setHumidity] = useState(52);
  const [pm25Outdoor, setPm25Outdoor] = useState(14.2);
  const [pm10Outdoor, setPm10Outdoor] = useState(22.5);
  const [weatherCondition, setWeatherCondition] = useState({
    title: 'Mostly Sunny',
    wind: '12 km/h',
    humidity: '52%'
  });
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [lastLiveSyncTime, setLastLiveSyncTime] = useState('');

  // Actuator Devices state (Requirement 4: Air Purifier is OFF in Eco Standby when air is clean)
  const [windowLOpen, setWindowLOpen] = useState(true);
  const [windowROpen, setWindowROpen] = useState(true);
  const [hvacLevel, setHvacLevel] = useState(35);
  const [purifierOn, setPurifierOn] = useState(false); // Clean air -> OFF in Eco Standby
  const [purifierSpeed, setPurifierSpeed] = useState('Low');
  const [sensorsOnline, setSensorsOnline] = useState(4);

  // Admin Master Actuation State
  const [adminZoneTab, setAdminZoneTab] = useState('all');
  const [damperMode, setDamperMode] = useState('fresh'); // 'fresh', 'recirc', 'economizer'
  const [uvcSanitizerOn, setUvcSanitizerOn] = useState(true);
  const [ionizerOn, setIonizerOn] = useState(false);
  const [louverOpen, setLouverOpen] = useState(true);
  const [roofDamperOpen, setRoofDamperOpen] = useState(false);
  const [facilityTargetTemp, setFacilityTargetTemp] = useState(23.5);

  // Live Chart Time Range & Data
  const [timeRange, setTimeRange] = useState('1H');
  const [chartData, setChartData] = useState(INITIAL_CHART_DATA);

  // Notifications & Activity Stream
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);

  // Apply Theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch Live Data when user location is available
  const syncLiveLocationData = async (lat, lng) => {
    setIsFetchingLive(true);
    const result = await fetchLiveEnvironmentalData(lat, lng);
    if (result && result.success) {
      setOutdoorAQI(result.outdoorAQI);
      setIndoorAQI(result.indoorAQI);
      setTemperature(result.temperature);
      setHumidity(result.humidity);
      setPm25Outdoor(result.pm25Outdoor);
      setPm10Outdoor(result.pm10Outdoor);
      setWeatherCondition({
        title: result.weatherTitle,
        wind: result.windSpeed,
        humidity: `${result.humidity}%`
      });
      setLastLiveSyncTime(result.timestamp);
    }
    setIsFetchingLive(false);
  };

  // Trigger live data sync on login
  useEffect(() => {
    if (currentUser?.lat && currentUser?.lng) {
      syncLiveLocationData(currentUser.lat, currentUser.lng);
    }
  }, [currentUser?.lat, currentUser?.lng]);

  // AI Decision Engine Logic
  const getAiAction = () => {
    if (controlMode === 'manual') {
      return {
        action: 'Manual Override Active',
        desc: 'Manual commands active. The AI is observing and will alert if hazards arise.',
        reasons: [
          'User manual controls active',
          'Automated actuator triggers suspended',
          'Threshold alerts remaining armed'
        ],
        statusType: 'amber'
      };
    }

    if (outdoorAQI > 150) {
      return {
        action: 'Pollution Barrier Active',
        desc: 'Hazardous outdoor air detected. Windows locked sealed, HEPA purifier engaged at maximum power.',
        reasons: [
          `Outdoor AQI is high (${outdoorAQI})`,
          'Particulate ingress prevention active',
          'HEPA H14 internal recirculation running'
        ],
        statusType: 'red'
      };
    }

    if (co2Level > 800) {
      return {
        action: 'CO₂ Clearance Ventilation',
        desc: 'Indoor carbon dioxide is elevated. Opening motorized windows to draw fresh oxygen.',
        reasons: [
          `Indoor CO₂ at ${co2Level} ppm (threshold: 800)`,
          'Fresh ambient inflow needed for cognitive focus',
          'Cross-ventilation aerodynamics active'
        ],
        statusType: 'amber'
      };
    }

    // Default: Clean Air -> Natural Ventilation, Purifier OFF in Eco Standby
    return {
      action: 'Natural Ventilation (Eco Standby)',
      desc: 'Indoor and outdoor air quality is optimal. Smart windows are open for fresh air inflow. Air purifier is OFF to save electricity.',
      reasons: [
        `Indoor AQI is optimal (${indoorAQI})`,
        `Outdoor AQI is clean (${outdoorAQI})`,
        'Purifier in Eco Standby (Power draw: 0W)'
      ],
      statusType: 'good'
    };
  };

  const aiAction = getAiAction();

  // Helper: Append to activity log
  const addActivity = (text, type = 'green') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActivities((prev) => [{ time: timeStr, text, type }, ...prev.slice(0, 7)]);
  };

  // Actuator Handlers
  const toggleWindows = (open) => {
    setWindowLOpen(open);
    setWindowROpen(open);
    addActivity(open ? 'Windows opened for natural ventilation' : 'Windows sealed against outdoor drafts', open ? 'green' : 'red');
  };

  const togglePurifier = (on) => {
    setPurifierOn(on);
    if (on) {
      setPurifierSpeed('Standard');
      addActivity('HEPA Air Purifier powered ON', 'green');
    } else {
      setPurifierSpeed('Eco');
      addActivity('Air Purifier switched to Eco Standby (OFF - Clean Air)', 'blue');
    }
  };

  // Switch between Admin & Standard User Role
  const toggleRole = () => {
    const nextRole = currentUser.role === 'admin' ? 'user' : 'admin';
    setCurrentUser((prev) => ({
      ...prev,
      role: nextRole,
      roleLabel: nextRole === 'admin' ? 'System Administrator' : 'Space Occupant'
    }));
    addActivity(`Switched role to ${nextRole.toUpperCase()} mode`, 'blue');
  };

  // Simulation Routines
  const handleSimulatePollution = () => {
    setOutdoorAQI(220);
    setPm25Outdoor(85.4);
    setIndoorAQI(78);
    setWindowLOpen(false);
    setWindowROpen(false);
    setPurifierOn(true);
    setPurifierSpeed('Turbo');
    setHvacLevel(75);
    setControlMode('auto');
    addActivity('SIMULATION: Outdoor pollution spiked (AQI 220) → Windows auto-sealed, Purifier Turbo ON', 'red');
    setNotifications((prev) => [
      {
        title: 'Severe Outdoor Pollution Spike',
        message: 'AQI 220 detected. Automated barrier sealed windows and engaged HEPA filtration.',
        time: 'Just now',
        type: 'warning'
      },
      ...prev
    ]);
  };

  const handleSimulateHighCO2 = () => {
    setCo2Level(1240);
    setIndoorAQI(48);
    setOutdoorAQI(45);
    setWindowLOpen(true);
    setWindowROpen(true);
    setHvacLevel(70);
    setControlMode('auto');
    addActivity('SIMULATION: High CO₂ (1240 ppm) → Motorized windows opened, HVAC boosted for oxygen flush', 'amber');
    setNotifications((prev) => [
      {
        title: 'High CO₂ Concentration Alert',
        message: 'CO₂ exceeded 1000 ppm. Windows opened to restore oxygen balance.',
        time: 'Just now',
        type: 'warning'
      },
      ...prev
    ]);
  };

  const handleResetClean = () => {
    setOutdoorAQI(42);
    setIndoorAQI(32);
    setCo2Level(610);
    setPm25Outdoor(11.2);
    setWindowLOpen(true);
    setWindowROpen(true);
    setPurifierOn(false);
    setPurifierSpeed('Eco');
    setHvacLevel(35);
    setControlMode('auto');
    addActivity('Environment normalized → Air is clean, Purifier returned to Eco Standby (OFF)', 'green');
  };

  // Dynamic Room background selection
  const isLibrary = currentRoom.toLowerCase().includes('library');
  const roomImageSrc = isLibrary ? libraryImg : classroomImg;
  const roomImageFallback = isLibrary ? '/library.jpg' : '/classroom.jpg';

  // Format date/time
  const now = new Date();
  const todayFormatted = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // REQUIREMENT 1: If not signed in, show standalone AuthScreen Gateway
  if (!currentUser) {
    const handleAuthLogin = (userData, isFirstTimeSignUp) => {
      setCurrentUser(userData);
      if (isFirstTimeSignUp || userData?.isFirstTime) {
        setIsSetupActive(true);
        setActiveNav('setup');
      } else {
        setIsSetupActive(false);
        setActiveNav('dashboard');
      }
    };

    return (
      <AuthScreen
        onLoginSuccess={handleAuthLogin}
        onLogin={handleAuthLogin}
      />
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        isSetupActive={isSetupActive}
        setIsSetupActive={setIsSetupActive}
        theme={theme}
        setTheme={setTheme}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
        toggleRole={toggleRole}
      />

      {/* Main Content Area */}
      <main className="main-wrapper">
        {/* Top Header */}
        <TopHeader
          currentUser={currentUser}
          isFetchingLive={isFetchingLive}
          syncLiveLocationData={syncLiveLocationData}
          controlMode={controlMode}
          setControlMode={setControlMode}
          addActivity={addActivity}
          setIsSettingsModalOpen={setIsSettingsModalOpen}
          todayFormatted={todayFormatted}
          timeFormatted={timeFormatted}
          notifications={notifications}
          isNotifOpen={isNotifOpen}
          setIsNotifOpen={setIsNotifOpen}
        />

        {/* Dashboard Body Content */}
        <div className="dashboard-content">
          {/* SETUP MODE VIEW */}
          {isSetupActive ? (
            <SetupWizard
              user={currentUser}
              onComplete={(updatedConfig) => {
                setCurrentUser((prev) => ({ ...prev, ...updatedConfig }));
                if (updatedConfig.liveData && updatedConfig.liveData.success) {
                  setOutdoorAQI(updatedConfig.liveData.outdoorAQI);
                  setIndoorAQI(updatedConfig.liveData.indoorAQI);
                  setTemperature(updatedConfig.liveData.temperature);
                  setHumidity(updatedConfig.liveData.humidity);
                  setWeatherCondition({
                    title: updatedConfig.liveData.weatherTitle,
                    wind: updatedConfig.liveData.windSpeed,
                    humidity: `${updatedConfig.liveData.humidity}%`
                  });
                }
                addActivity(`Setup Mode completed: Customized for ${updatedConfig.location}`, 'green');
                setIsSetupActive(false);
                setActiveNav('dashboard');
              }}
              onCancel={() => {
                setIsSetupActive(false);
                setActiveNav('dashboard');
              }}
            />
          ) : activeNav === 'room' ? (
            <LiveRoomView
              currentRoom={currentRoom}
              setCurrentRoom={setCurrentRoom}
              setIsModalOpen={setIsModalOpen}
              roomImageSrc={roomImageSrc}
              roomImageFallback={roomImageFallback}
              windowLOpen={windowLOpen}
              windowROpen={windowROpen}
              hvacLevel={hvacLevel}
              setHvacLevel={setHvacLevel}
              purifierOn={purifierOn}
              toggleWindows={toggleWindows}
              togglePurifier={togglePurifier}
              currentUser={currentUser}
            />
          ) : activeNav === 'air' ? (
            <AirQualityMapView
              currentRoom={currentRoom}
              setCurrentRoom={setCurrentRoom}
              addActivity={addActivity}
              pm25Outdoor={pm25Outdoor}
              pm10Outdoor={pm10Outdoor}
              co2Level={co2Level}
              humidity={humidity}
            />
          ) : activeNav === 'analytics' ? (
            <AnalyticsView
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              chartData={chartData}
              addActivity={addActivity}
            />
          ) : activeNav === 'controls' ? (
            <MasterControlsView
              currentUser={currentUser}
              windowLOpen={windowLOpen}
              setWindowLOpen={setWindowLOpen}
              windowROpen={windowROpen}
              setWindowROpen={setWindowROpen}
              louverOpen={louverOpen}
              setLouverOpen={setLouverOpen}
              roofDamperOpen={roofDamperOpen}
              setRoofDamperOpen={setRoofDamperOpen}
              purifierOn={purifierOn}
              setPurifierOn={setPurifierOn}
              purifierSpeed={purifierSpeed}
              setPurifierSpeed={setPurifierSpeed}
              damperMode={damperMode}
              setDamperMode={setDamperMode}
              hvacLevel={hvacLevel}
              setHvacLevel={setHvacLevel}
              facilityTargetTemp={facilityTargetTemp}
              setFacilityTargetTemp={setFacilityTargetTemp}
              uvcSanitizerOn={uvcSanitizerOn}
              setUvcSanitizerOn={setUvcSanitizerOn}
              ionizerOn={ionizerOn}
              setIonizerOn={setIonizerOn}
              adminZoneTab={adminZoneTab}
              setAdminZoneTab={setAdminZoneTab}
              addActivity={addActivity}
              handleResetClean={handleResetClean}
              setControlMode={setControlMode}
              toggleWindows={toggleWindows}
              togglePurifier={togglePurifier}
            />
          ) : activeNav === 'automation' ? (
            <AutomationView />
          ) : (
            <DashboardView
              outdoorAQI={outdoorAQI}
              indoorAQI={indoorAQI}
              co2Level={co2Level}
              temperature={temperature}
              humidity={humidity}
              pm25Outdoor={pm25Outdoor}
              pm10Outdoor={pm10Outdoor}
              weatherCondition={weatherCondition}
              windowLOpen={windowLOpen}
              windowROpen={windowROpen}
              hvacLevel={hvacLevel}
              setHvacLevel={setHvacLevel}
              purifierOn={purifierOn}
              sensorsOnline={sensorsOnline}
              currentRoom={currentRoom}
              setCurrentRoom={setCurrentRoom}
              roomImageSrc={roomImageSrc}
              roomImageFallback={roomImageFallback}
              setIsModalOpen={setIsModalOpen}
              controlMode={controlMode}
              setControlMode={setControlMode}
              aiAction={aiAction}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              chartData={chartData}
              activities={activities}
              addActivity={addActivity}
              toggleWindows={toggleWindows}
              togglePurifier={togglePurifier}
              handleSimulatePollution={handleSimulatePollution}
              handleSimulateHighCO2={handleSimulateHighCO2}
              handleResetClean={handleResetClean}
              currentUser={currentUser}
            />
          )}
        </div>

        {/* Global Footer */}
        <AppFooter />
      </main>

      {/* Popups & Modals */}
      {isModalOpen && (
        <SimulationModal
          onClose={() => setIsModalOpen(false)}
          currentRoom={currentRoom}
          windowLOpen={windowLOpen}
          windowROpen={windowROpen}
          hvacLevel={hvacLevel}
          purifierOn={purifierOn}
          indoorAQI={indoorAQI}
          co2Level={co2Level}
          temperature={temperature}
          humidity={humidity}
          roomImageSrc={roomImageSrc}
          roomImageFallback={roomImageFallback}
        />
      )}

      {isNotifOpen && (
        <NotificationModal
          notifications={notifications}
          onClose={() => setIsNotifOpen(false)}
          onClear={() => setNotifications([])}
        />
      )}

      {isSettingsModalOpen && (
        <UserSettingsModal
          user={currentUser}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={(updatedProfile) => {
            setCurrentUser((prev) => ({ ...prev, ...updatedProfile }));
            setIsSettingsModalOpen(false);
            addActivity(`Updated location & profile for ${updatedProfile.name}`, 'green');
            if (updatedProfile.lat && updatedProfile.lng) {
              syncLiveLocationData(updatedProfile.lat, updatedProfile.lng);
            }
          }}
        />
      )}
    </div>
  );
}

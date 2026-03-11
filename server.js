// Konfiguracja serwera BetterBubble.am
var config = {
    // [LOGIKA GRY]
    serverMaxConnections: 64,    // Maksymalna liczba graczy
    serverPort: 3000,            // Port Twojego serwera
    
    // [MAPA I JEDZENIE]
    borderLeft: 0,
    borderRight: 6000,           // Większa mapa = więcej zabawy
    borderTop: 0,
    borderBottom: 6000,
    foodMinAmount: 500,          // Ile jedzenia na start
    foodMaxAmount: 1000,         // Maksymalna ilość kropek
    foodMass: 1,                 // Masa jednej kropki
    
    // [WIRUSY]
    virusMinAmount: 15,          // Liczba zielonych kolczatek
    virusStartMass: 100,         // Masa wirusa
    virusFeedAmount: 7,          // Ile razy trzeba strzelić "W", by wirus pękł

    // [GRACZ - MECHANIKA 1:1]
    playerStartMass: 34,         // Startowa wielkość (oryginalne Agar.io)
    playerMaxMass: 22500,        // Maksymalna masa jednej komórki
    playerMinMassEject: 35,      // Od kiedy można strzelać "W"
    playerMinMassSplit: 35,      // Od kiedy można się dzielić "Space"
    playerMaxCells: 16,          // Limit podziałów (standard to 16)
    playerRecombineTime: 30,     // Czas łączenia się kulek (w sekundach)
    playerSpeed: 1.0,            // Mnożnik prędkości (1.0 = standard)
    
    // [BOTY]
    serverBots: 10,              // Dodaj 10 botów, żeby mapa nie była pusta
};

module.exports = config;

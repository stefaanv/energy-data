# Home Energy Management System

This software is an attempt to control and optimise energy consumption in my home.  [Home Assistant](https://www.home-assistant.io/) is used as (device driver) middleware.
As a first success, I managed to push the price ofelectricity imported from the grid below 10c€/kWh by manually shifting the load into the cheap periods.

## Current functionality
- Energy-tasks (charge battery, discharge battery, optimize self-consumption)
- Read energy-tasks from auto-reloading javascript config file
- REST interface for the [front-end](https://github.com/stefaanv/energy-control) to manage the energy-tasks
- Store hourly price, quarterly consumption and energy-tasks in a sqLite database
- Provide ability to shift electricity load in time

## Future functionality
- Enhance the frontend to show pricing and expected consumption data
- Calculate monthly cost of electricity imported from the grid and revenue of electricity injeted into the grid
- Manage large switchable consumers like water-heater, air exchange, heat pump and pool pump
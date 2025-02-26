class BarChartRace {
  constructor(chartId, extendedSettings) {
    this.chartSettings = {
      width: 500,
      height: 380,
      maxWidth: 500,
      maxHeight: 380,
      padding: 40,
      titlePadding: 5,
      columnPadding: 0.4,
      ticksInXAxis: 5,
      duration: 1500,
      ...extendedSettings
    };
    this.containerId = "bar-chart-container";

    this.chartSettings.innerWidth = this.chartSettings.width - this.chartSettings.padding * 2;
    this.chartSettings.innerHeight = this.chartSettings.height - this.chartSettings.padding * 2;

    this.chartDataSets = [];
    this.chartTransition;
    this.timerStart;
    this.timerEnd;
    this.currentDataSetIndex = 0;
    this.elapsedTime = this.chartSettings.duration;
    this.isPlaying = true; // Initialize isPlaying flag
    this.xAxisScale = d3.scaleLinear().range([0, this.chartSettings.innerWidth]);
    this.yAxisScale = d3.scaleBand().range([this.chartSettings.innerHeight, 0]).padding(0.1);
    this.colorScale = d3.scaleOrdinal()
    .domain([
      "Meowth", "Pikachu", "Brock", "Ash", 
      "Jessie", "James", "Dawn", "Paul", "Zoey", 
      "Barry"
      
    ])
    //#FDD835 is Pikachu yellow
    //##990066 is jessie's hair
    //#4169E1 james hair
    //#D1001F Red for Ash bar
    .range([
      "lightpink", "beige", "#D1001F", "#990066", 
      "#4169E1", "#FDD835", "brown", "black", "orange", 
      "green"
    ]);

    // Append SVG element to the container
    console.log(`#${this.containerId}`)
        this.svg = d3.select(`#${this.containerId}`)
        .append("svg")
        .attr("id", "bar-chart-race-svg")
        .attr("width", this.chartSettings.width)
        .attr("height", this.chartSettings.height);
  
      // Append chart container group to the SVG
      this.chartContainer = this.svg.append("g")
        .attr("class", "chart-container")
        .attr("transform", `translate(${this.chartSettings.padding}, ${this.chartSettings.padding})`);
  
      // Append x-axis group
      this.xAxisContainer = this.chartContainer.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${this.chartSettings.innerHeight})`);
  
      // Append y-axis group
      this.yAxisContainer = this.chartContainer.append("g")
        .attr("class", "y-axis");
  
      // Append columns group
      this.columnsContainer = this.chartContainer.append("g")
        .attr("class", "columns");
  
      // Append chart title
      this.svg.append("text")
        .attr("class", "chart-title")
        .attr("x", this.chartSettings.padding)
        .attr("y", this.chartSettings.padding - 15)
        .attr("text-anchor", "start") // Align to the start of the text (left)
        .style("font-weight", "bold") // Make the text bold
        .text("Pokemon DP Bar Chart Race");
  
     // Append current date text to the SVG element
      this.svg.append("text")
        .attr("class", "current-date")
        .attr("x", this.chartSettings.width - this.chartSettings.padding)
        .attr("y", this.chartSettings.padding - 15)
        .attr("text-anchor", "end") // Align to the end of the text (right)
        .style("font-weight", "bold") // Make the text bold
        .text("Current Episode:");

          // Append stop button to the SVG
          this.svg.append("rect")
          .attr("class", "control-button-background")
          .attr("x", this.chartSettings.padding - 5)
          .attr("y", this.chartSettings.height - 25)
          .attr("width", 45)
          .attr("height", 25)
          .style("fill", "white") // Set background color to white
          .style("stroke", "black") // Set border color to black
          .style("stroke-width", "1px"); // Set border width

          this.svg.append("text")
          .attr("class", "control-button")
          .attr("x", this.chartSettings.padding)
          .attr("y", this.chartSettings.height - 10)
          .attr("text-anchor", "start")
          .style("cursor", "pointer")
          .style("fill", "black") // Set text color to black
          .text("Stop")
          .on("click", () => this.stop());

          // Append play button to the SVG
          this.svg.append("rect")
          .attr("class", "control-button-background")
          .attr("x", this.chartSettings.padding + 45)
          .attr("y", this.chartSettings.height - 25)
          .attr("width", 45)
          .attr("height", 25)
          .style("fill", "white") // Set background color to white
          .style("stroke", "black") // Set border color to black
          .style("stroke-width", "1px"); // Set border width

          this.svg.append("text")
          .attr("class", "control-button")
          .attr("x", this.chartSettings.padding + 50)
          .attr("y", this.chartSettings.height - 10)
          .attr("text-anchor", "start")
          .style("cursor", "pointer")
          .style("fill", "black") // Set text color to black
          .text("Play")
          .on("click", () => this.start());

          // Append replay button to the SVG
          this.svg.append("rect")
          .attr("class", "control-button-background")
          .attr("x", this.chartSettings.padding + 95)
          .attr("y", this.chartSettings.height - 25)
          .attr("width", 60)
          .attr("height", 25)
          .style("fill", "white") // Set background color to white
          .style("stroke", "black") // Set border color to black
          .style("stroke-width", "1px"); // Set border width

          this.svg.append("text")
          .attr("class", "control-button")
          .attr("x", this.chartSettings.padding + 100)
          .attr("y", this.chartSettings.height - 10)
          .attr("text-anchor", "start")
          .style("cursor", "pointer")
          .style("fill", "black") // Set text color to black
          .text("Replay")
          .on("click", () => this.replay());
    }

    draw(data, transition) {
      const { episode, dataSet } = data;
      const { innerHeight, titlePadding } = this.chartSettings;
  
      // Set title with current season and episode
      const { season, episode: currentEpisode } = this.chartDataSets[this.currentDataSetIndex];
      this.setTitle(`Season ${season}, Episode ${currentEpisode}`);
  
      // Extract characters from dataSet
      const characters = [];
  
      // Accumulate dialogue counts from all datasets up to the current episode index
      for (let i = 0; i <= this.currentDataSetIndex; i++) {
          const currentData = this.chartDataSets[i].dataSet;
          currentData.forEach(({ name, value }) => {
              const existingCharacterIndex = characters.findIndex(char => char.name === name);
              if (existingCharacterIndex !== -1) {
                  characters[existingCharacterIndex].value += value;
              } else {
                  characters.push({ name, value });
              }
          });
      }
  
      // Sort characters based on their accumulated dialogue counts
      characters.sort((a, b) => b.value - a.value);
  
      // Update scales based on the accumulated dialogue counts
      this.xAxisScale.domain([0, d3.max(characters, d => d.value)]);
      this.yAxisScale.domain(characters.map(d => d.name));
  
      const barGroups = this.chartContainer
          .select(".columns")
          .selectAll("g.column-container")
          .data(characters, d => d.name);
  
      const barGroupsEnter = barGroups
          .enter()
          .append("g")
          .attr("class", "column-container")
          .attr("transform", `translate(0,${innerHeight})`);
  
      barGroupsEnter
          .append("rect")
          .attr("class", "column-rect")
          .attr("width", 0)
          .attr("height", this.yAxisScale.step() * (1 - this.chartSettings.columnPadding));
  
      // Append text for column titles
      barGroupsEnter
          .append("text")
          .attr("class", "column-title")
          .attr("y", (this.yAxisScale.step() * (1 - this.chartSettings.columnPadding)) / 2)
          .attr("x", d => Math.max(this.xAxisScale(d.value), 2 * titlePadding)) // Move the label alongside the bars with a fixed padding, ensuring it's not positioned too far off
          .attr("dx", 10) // Add some additional padding to separate the labels from the bars
          .attr("dy", "0.35em") // Adjust vertical alignment if needed
          .style("font-size", "12px") // Adjust font size as needed
          .style("text-anchor", "start") // Set text-anchor to start
          .text(({ name }) => name);
  
      const barUpdate = barGroupsEnter.merge(barGroups);
      // Define bodyExit
      const bodyExit = barGroups.exit();
  
      if (this.isPlaying) {
          // Apply transition to elements
          barUpdate.transition(transition)
              .attr("transform", ({ name }) => `translate(0,${this.yAxisScale(name)})`)
              .attr("fill", "normal");
  
          barUpdate.select(".column-rect").transition(transition)
              .attr("fill", d => this.colorScale(d.name))
              .attr("width", ({ value }) => this.xAxisScale(value));
  
          barUpdate.select(".column-title").transition(transition)
              .attr("x", ({ value }) => this.xAxisScale(value) - titlePadding);
  
          // Add transition to text updates
          barUpdate.select(".column-value").transition(transition)
              .attr("x", ({ value }) => this.xAxisScale(value) + titlePadding)
              .tween("text", ({ value }) => {
                  const interpolateStartValue =
                      this.elapsedTime === this.chartSettings.duration
                          ? this.currentValue || 0
                          : +this.innerHTML;
  
                  const interpolate = d3.interpolate(interpolateStartValue, value);
                  this.currentValue = value;
  
                  return (t) => {
                      d3.select(this).text(Math.ceil(interpolate(t)));
                  };
              });
  
          // Apply exit transition
          bodyExit.transition(transition)
              .attr("transform", `translate(0,${innerHeight})`)
              .on("end", function () {
                  d3.select(this).attr("fill", "none");
              });
  
          // Apply exit transition to children elements
          bodyExit.select(".column-title").transition(transition).attr("x", 0);
  
          bodyExit.select(".column-rect").transition(transition).attr("width", 0);
  
          bodyExit.select(".column-value").transition(transition)
              .attr("x", titlePadding)
              .tween("text", function () {
                  const interpolate = d3.interpolate(this.currentValue, 0);
                  this.currentValue = 0;
  
                  return function (t) {
                      d3.select(this).text(Math.ceil(interpolate(t)));
                  };
              });
      } else {
          // If isPlaying is false, update elements without transition
          barUpdate.attr("transform", ({ name }) => `translate(0,${this.yAxisScale(name)})`)
              .attr("fill", "normal");
  
          barUpdate.select(".column-rect")
              .attr("fill", d => this.colorScale(d.name))
              .attr("width", ({ value }) => this.xAxisScale(value));
  
          barUpdate.select(".column-title")
              .attr("x", ({ value }) => this.xAxisScale(value) - titlePadding);
  
          barUpdate.select(".column-value")
              .attr("x", ({ value }) => this.xAxisScale(value) + titlePadding)
              .text(({ value }) => Math.ceil(value));
  
          // Apply exit transition without transition
          bodyExit.attr("transform", `translate(0,${innerHeight})`)
              .on("end", function () {
                  d3.select(this).attr("fill", "none");
              });
  
          bodyExit.select(".column-title").attr("x", 0);
  
          bodyExit.select(".column-rect").attr("width", 0);
  
          bodyExit.select(".column-value").attr("x", titlePadding).text(0);
      }
  
      return this;
  }
  addDataset(dataSet) {
    this.chartDataSets.push(dataSet);

    return this;
  }

  addDatasets(dataSets) {
    if (!Array.isArray(dataSets)) {
      console.error("DataSets must be an array.");
      return this;
    }
    
    this.chartDataSets.push(...dataSets);

    return this;
  }

  setTitle(title) {
    // Update the title position
    d3.select(".chart-title")
        .attr("x", this.chartSettings.padding)
        .attr("y", this.chartSettings.padding - 15)
        .style("font-weight", "bold") // Make the text bold
        .attr("text-anchor", "start") // Align to the start of the text (left)
        

    // Update the "Current Episode" text position
    d3.select(".current-date")
        .attr("x", this.chartSettings.width - this.chartSettings.padding)
        .attr("y", this.chartSettings.padding - 15)
        .attr("text-anchor", "end") // Align to the end of the text (right)
        .style("font-weight", "bold") // Make the text bold
        .text(title);

    return this;
}

  async render(index = 0) {
    console.log("Rendering chart for episode:", index);
    this.currentDataSetIndex = index;
    this.timerStart = d3.now();

    // Log the data passed to the draw function
    console.log("Data for rendering:", this.chartDataSets[index]);

    // Create transition only if isPlaying is true
    if (this.isPlaying) {
        this.chartTransition = this.chartContainer
            .transition()
            .duration(this.elapsedTime)
            .ease(d3.easeLinear)
            .on("end", () => {
                if (index < this.chartDataSets.length) {
                    console.log("Transition ended, rendering next episode...");
                    this.elapsedTime = this.chartSettings.duration;
                    // Render the next episode
                    this.render(index + 1);
                } else {
                    console.log("All episodes rendered.");
                }
            })
            .on("interrupt", () => {
                console.log("Transition interrupted.");
                this.timerEnd = d3.now();
            });
    }

    // Draw the chart for the current episode
    if (index < this.chartDataSets.length) {
        console.log("Drawing chart for current episode...");
        this.draw(this.chartDataSets[index], this.chartTransition);
    }

    return this;
  }

  replay() {
    // Reset the elapsed time to the start time
    this.elapsedTime = 0;
  
    // Clear the existing chart elements
    this.chartContainer.selectAll(".column-container").remove();
  
    // Reset the current data set index to 0
    this.currentDataSetIndex = 0;
  
    // Set the title back to the first episode
    this.setTitle(`Season ${this.chartDataSets[0].season}, Episode ${this.chartDataSets[0].episode}`);
  
    // Start rendering from the beginning
    this.render();
  
    return this;
  }

  stop() {
    // Set isPlaying flag to false
    this.isPlaying = false;
    this.chartContainer.selectAll("*").interrupt();
    return this;
  }

  start() {
    // Set isPlaying flag to true
    this.isPlaying = true;

    // If the timerStart is not yet initialized or if the timerEnd is already initialized, start rendering from the current episode index
    if (!this.timerStart || this.timerEnd) {
        // Start the timer
        this.timerStart = d3.now();
        this.render(this.currentDataSetIndex);
    } else {
        // If the timer is paused, resume rendering from the current episode index
        // Subtract the paused time from the elapsed time
        this.elapsedTime -= this.timerEnd - this.timerStart;

        // Start rendering from the current episode
        this.render(this.currentDataSetIndex);
    }

    return this;
}
}

import { Component, OnInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { HttpClient } from '@angular/common/http';
import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';

import { Label } from 'ng2-charts';


// import { finnhub } from 'finnhub';
// declare var System: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit {
  public barChartPlugins = [pluginDataLabels];
  public barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      xAxes: [{}], yAxes: [{
        ticks: {}
      }]
    },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end',
      }
    }
  };
  public tickerSymbols = [];
  public barChartLabels = [];
  public barChartType = 'bar';
  public barChartLegend = false;
  public barChartData = [
    {
      data: [],
      labels: []
    }
  ];


  chartObj = {}
  tickerSymbol = ''
  disableInput: boolean = false;

  darkTheme: boolean = true;

  baseUrl = 'https://cloud.iexapis.com/stable/stock/'
  apiToken = 'pk_044db279039d465eb16ff69f5b0ead45';

  constructor(private http: HttpClient) { }

  addSymbol() {
    if (this.tickerSymbols.length <= 9) {
      if (!this.tickerSymbols.includes(this.tickerSymbol)) {
        this.tickerSymbols.push(this.tickerSymbol)
      }
      else {
        this.tickerSymbols.push(this.tickerSymbol)

        // throw error saying already exists
      }
    }
    else {
      this.disableInput = true;
      //toaster saying max limit reached
    }

    this.tickerSymbol = ''
  }

  ngOnInit() {
    this.getStockData();
  }

  getStockData() {
    for (let index = 0; index < this.tickerSymbols.length; index++) {
      let ticker = this.tickerSymbols[index]
      let finalUrl = `${this.baseUrl}${ticker}/quote?token=${this.apiToken}`;
      this.http.get<any>(finalUrl).subscribe(
        data => {
          this.chartObj[ticker] = data.latestPrice
          if (index == this.tickerSymbols.length - 1) {
            this.loadDataIntoGraph();
          }
        },
        error => {
          this.tickerSymbols.splice(index, 1);
          console.log(`Error code for ${ticker} : ${error.error}`)
          //toaster saying error message

        })
    }
    setTimeout(() => {
      this.getStockData();
    }, 5000);

  }

  loadDataIntoGraph() {
    let graphArr = []
    let tickers = Object.keys(this.chartObj)
    for (let i = 0; i < tickers.length; i++) {
      graphArr.push(this.chartObj[tickers[i]])
    }
    this.barChartLabels = [...tickers];
    // this.barChartOptions.scales.yAxes[0].ticks.max = (Math.ceil(Math.max(...graphArr) + 50))
    this.barChartData[0].data = [...graphArr]
  }

  clearAll() {
    this.barChartData[0].data = [];
    this.barChartLabels = []
    this.tickerSymbols = []
    this.chartObj = {}
    this.disableInput = false;
  }
}

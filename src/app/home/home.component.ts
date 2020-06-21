import { Component, OnInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { HttpClient } from '@angular/common/http';
import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import * as pluginDataLabels from 'chartjs-plugin-datalabels';
import { ToastrService } from 'ngx-toastr';

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
      xAxes: [{
        ticks: {
          fontColor: '#888',
        }
      }],
      yAxes: [{
        ticks: {
          fontColor: '#888',
        }
      }]
    },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end',
      }
    }
  };

  objectKeys = Object.keys;

  public tickerSymbols = [];
  public tickerSymbolsObj = {};
  public barChartLabels = [];
  public barChartType = 'bar';
  public barChartLegend = false;
  public barChartData = [
    {
      data: [],
      labels: []
    }
  ];


  tickerSymbol = ''
  disableInput: boolean = false;
  timeoutKiller;
  chartObj = {}
  darkTheme: boolean = true;
  isValid: boolean = false;

  testUrl_pre = "https://cloud.iexapis.com/stable/stock/market/batch?symbols="
  testUrl_post = "&types=quote&token=pk_044db279039d465eb16ff69f5b0ead45"


  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) { }


  validate() {
    debugger
    let baseUrl = 'https://cloud.iexapis.com/stable/stock/'
    let apiToken = 'pk_044db279039d465eb16ff69f5b0ead45';
    let finalUrl = `${baseUrl}${this.tickerSymbol}/quote?token=${apiToken}`;
    this.http.get<any>(finalUrl).subscribe(
      data => {
        this.isValid = true;
        this.addToList();
      },
      error => {
        this.toasterPop(`Failed to get data for ${this.tickerSymbol}: ${error.error}`);
        this.tickerSymbol = ''
        this.isValid = false;
      });
  }
  getData() {
    let tickerSymbols = this.tickerSymbols
    let str = ""
    for (let index = 0; index < tickerSymbols.length; index++) {
      str += "" + tickerSymbols[index] + ",";
    }
    let final_url = this.testUrl_pre + str + this.testUrl_post;
    this.http.get<any>(final_url).subscribe(
      data => {
        console.log('data', data)
        this.chartObj = data;
        this.loadDataIntoGraph();
      },
      error => {
        this.toasterPop(`Failed to get data: ${error.error}`);
      })

    this.timeoutKiller = setTimeout(() => {
      this.getData();
    }, 5000);

  }

  addToList() {
    if (this.isValid) {
      if (this.tickerSymbols.length <= 9) {
        if (!this.tickerSymbols.includes(this.tickerSymbol)) {
          this.tickerSymbols.push(this.tickerSymbol)
          clearTimeout(this.timeoutKiller);
          this.getData();
        }
        else {
          this.toasterPop(`${this.tickerSymbol} already exists`);
        }
      }
      else {
        this.disableInput = true;
        this.toasterPop(`Max limit: 10 reached`);
      }
      this.tickerSymbol = ''
    }
  }



  deleteStock(symbol) {
    let index = this.tickerSymbols.indexOf(symbol.toLowerCase())
    this.tickerSymbols.splice(index, 1);
    delete this.tickerSymbolsObj[symbol]
    clearTimeout(this.timeoutKiller);
    if (this.tickerSymbols.length) {
      this.getData();
    }
    else {
      this.clearAll()
    }
  }

  loadDataIntoGraph() {
    let graphArr = []
    let tickers = Object.keys(this.chartObj)
    for (let i = 0; i < tickers.length; i++) {
      graphArr.push(this.chartObj[tickers[i]].quote.latestPrice)
      this.tickerSymbolsObj[tickers[i]] = this.chartObj[tickers[i]].quote.companyName
    }
    this.barChartLabels = [...tickers];
    this.barChartData[0].data = [...graphArr]
  }

  clearAll() {
    this.barChartData[0].data = [];
    this.barChartLabels = []
    this.tickerSymbols = []
    this.tickerSymbolsObj = {}
    this.chartObj = {}
    clearTimeout(this.timeoutKiller);

  }

  toasterPop(message) {
    this.toastr.error(message, 'Error', {
      timeOut: 3000
    });
  }

  ngOnInit() {
  }


}

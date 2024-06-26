import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { DatePipe } from '@angular/common'

import * as Highcharts from 'highcharts';
import Streamgraph from 'highcharts/modules/streamgraph';
import theme  from 'highcharts/themes/grid-light';
import _ from 'lodash';

Streamgraph(Highcharts);

Highcharts.setOptions({

});
theme(Highcharts);     



console.log('init');

import { DataService } from 'src/app/services/data.service';
import { TxTypePipe } from 'src/app/pipes/txType.pipe';
import { Globals } from 'src/app/globals';
import { stringify } from 'querystring';




@Component({
    selector: 'app-stat-days-count',
    templateUrl: './stat-days-count.component.html',
    styleUrls: ['./stat-days-count.component.less']
})
export class StatDaysCountComponent implements OnInit, AfterViewInit {

    canvas: any;
    ctx: any;
    statTransactions: any;
    statContent: any;
    statPeriod: any = 30;
    show: boolean = true;
    loadingUsers: boolean = false;
    loadingTransactions: boolean = false;
    showChart: boolean = true;

    constructor(
        private dataService: DataService,
        private global: Globals,
        private txTypePipe: TxTypePipe,
        public datepipe: DatePipe) { 

        }

    get Global(): Globals {
        return this.global;
    }


    ngOnInit() {



        
    }

    ngAfterViewInit() {
        this.loadDataUsers();
        this.loadDataTransactions();
    }

    toggleShow() {
        this.show = !this.show;
    }

    loadDataUsers() {
        if (this.loadingUsers) return;
        this.loadingUsers = true;

        this.dataService.getStatisticContent(this.statPeriod,
            data => {
                this.loadingUsers = false;
                
                this.statContent = data;
                this.fillChartUsers();

                setTimeout(() => {
                    this.loadDataUsers();
                }, this.global.updateInterval);
            },
            err => {
                setTimeout(() => {
                    this.loadDataUsers();
                }, this.global.updateInterval);
            }
        );
    }

    loadDataTransactions() {
        if (this.loadingTransactions) return;

        this.loadingTransactions = true;

        this.dataService.getStatistic(this.statPeriod,
            data => {
                this.loadingTransactions = false;

                this.statTransactions = data;
                this.fillChartTransactions();
        
                setTimeout(() => {
                    this.loadDataTransactions();
                }, this.global.updateInterval);
            },
            err => {
                setTimeout(() => {
                    this.loadDataTransactions();
                }, this.global.updateInterval);
            }
        );
    }


    dateFormatter(maxKey: any, point: any) {
        let pointDate = new Date();
        
        if (this.statPeriod > 1) {
            pointDate.setDate(pointDate.getDate() - (maxKey - point));
            return `${this.datepipe.transform(pointDate, 'MM/dd/yyyy')}`;
        }

        if (this.statPeriod == 1) {
            pointDate.setHours(pointDate.getHours() - (maxKey - point));
            return `${this.datepipe.transform(pointDate, 'HH:mm')}`;
        }

        return '¯\_(ツ)_/¯';
    }

    fillChartContent() {
        
        let _datasets = {};
        let categories = [];
        let self = this;

        for (let x in this.statContent)
        {
            categories.push(x);

            _datasets[x] = {
                name: x,
                data: [
                    this.statContent[x]
                ]
            };
        }

        let datasets = [];
        for (let d in _datasets) {
            datasets.push(_datasets[d]);
        }

        const id = 'stat_days_content_canvas';

        Highcharts.chart(id, {
            title: {
                text: ''
            },
            chart: {
                type: 'column',
                
            },
            yAxis: {
                title: {
                    text: 'Count'
                }
            },
            xAxis: {
                categories: categories,
                labels: {
                    formatter: function () { return String(this.value); },
                    style: {
                        fontSize: '0.6rem'
                    }
                },
            },
            legend: {
                enabled: true,
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom'
            },
            tooltip: {
                shared: false,
                formatter: function () {
                    return `<span style="color:${this.color}">\u25CF</span> ${this.series.name}: <b><span style="font-size: 13px">${this.y}</span></b><br/>`;
                }
            },
            plotOptions: {
                spline: {
                    marker: {
                        enabled: false
                    }
                },
                series: {
                    connectNulls: true,
                    animation: false
                }
            },
            series: datasets
        });


    }

    fillChartUsers() {
        let data = [];
        let datasets = [];
        let categories = [];
        let self = this;

        let maxKey = Math.max.apply(null, Object.keys(this.statContent));

        for (let x in this.statContent) {
            categories.push(x);

            let y = this.statContent[x];
            data.push(y);
        }

        datasets.push({
            name: 'Accounts',
            data: data
        });

        Highcharts.chart('stat_days_content_canvas', {
            title: {
                text: ''
            },
            chart: {
                type: 'spline'
            },
            yAxis: {
                title: {
                    text: ''
                }
            },
            xAxis: {
                categories: categories,
                type: 'datetime',
                labels: {
                    formatter: function () {
                        return self.dateFormatter(maxKey, Number(this.value));
                    },
                    style: {
                        fontSize: '0.6rem'
                    }
                },
            },
            legend: {
                enabled: true,
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom'
            },
            tooltip: {
                shared: true,
                //crosshairs: true,
                formatter: function () {
                    let points = this.points;
                    let pointsLength = points.length;

                    let day = self.dateFormatter(maxKey, Number(points[0].key));
                    let tooltipMarkup = pointsLength ? `<b><span style="font-size: 13px;">${day}</span></b><br/>` : ``;

                    let index;
                    for (index = 0; index < pointsLength; index += 1) {
                        tooltipMarkup += `<span style="color:${points[index].color}">\u25CF</span> ${points[index].series.name}: <b><span style="font-size: 12px;">${points[index].y}</span></b><br/>`;
                    }

                    return tooltipMarkup;
                }
            },
            plotOptions: {
                spline: {
                    marker: {
                        enabled: false
                    }
                },
                series: {
                    connectNulls: true
                }
            },
            series: datasets,
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        legend: {
                            layout: 'horizontal',
                            align: 'center',
                            verticalAlign: 'bottom'
                        }
                    }
                }]
            }
        });
    }

    fillChartTransactions() {
        let _datasets = {};
        let categories = [];
        let self = this;
        let yAxisCounter = {};

        let maxKey = Math.max.apply(null, Object.keys(this.statTransactions));

        for (let x in this.statTransactions)
        {
            categories.push(x);

            for (let y in this.statTransactions[x])
            {
                if (y == "205") continue;
                if (y == "303") continue;

                if (!(y in yAxisCounter))
                    yAxisCounter[y] = Object.keys(yAxisCounter).length;

                if (!(y in _datasets)) {
                    _datasets[y] = {
                        name: this.txTypePipe.transformType(y),
                        data: []
                    };
                }

                let count = Number(this.statTransactions[x][y]);
                if (y == "302")
                    count += Number(this.statTransactions[x]["303"]);

                _datasets[y].data.push({
                    x: Number(x),
                    y: count
                });
            }
        }

        let yAxis = [
            {
                title: {
                    text: ''
                },
                visible: true,
                opposite: true
            },
            {
                title: {
                    text: ''
                },
                visible: true,
                opposite: false
            }
        ];

        let opposite = [300,301,204,200,302];
        let datasets = [];
        for (let d in _datasets) {
            _datasets[d].yAxis = opposite.indexOf(+d) >= 0 ? 0 : 1;
            datasets.push(_datasets[d]);
        }

        Highcharts.chart('stat_days_count_canvas', {
            chart: {
                type: 'spline'
            },
            title: {
                text: ''
            },
            yAxis: yAxis,
            xAxis: {
                type: 'category',
                categories: categories,
                crosshair: false,
                tickmarkPlacement: 'on',
                labels: {
                    formatter: function() {
                        return self.dateFormatter(maxKey, Number(this.value));
                    },
                    style: {
                        fontSize: '0.6rem'
                    }
                },
                visible: true,
            },
            legend: {
                enabled: true,
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom'
            },
            tooltip: {
                shared: true,
                formatter: function () {
                    let points = this.points;
                    let pointsLength = points.length;

                    let day = self.dateFormatter(maxKey, Number(points[0].key));
                    let tooltipMarkup = pointsLength ? `<b><span style="font-size: 13px;">${day}</span></b><br/>` : ``;

                    let index;
                    for (index = 0; index < pointsLength; index += 1) {
                        tooltipMarkup += `<span style="color:${points[index].color}">\u25CF</span> ${points[index].series.name}: <b><span style="font-size: 12px;">${points[index].y}</span></b><br/>`;
                    }

                    return tooltipMarkup;
                }
            },
            plotOptions: {
                area: {
                    stacking: 'percent',
                    marker: {
                        enabled: false
                    }
                },
                spline: {
                    marker: {
                        enabled: false
                    },
                    events: {
                        legendItemClick: function(event) {
                            let current = this;
                            let s = this.chart.series.filter(s => { return s == current; });
                            if (s && s[0].visible) {
                                this.chart.series.forEach(s => {
                                    if (s != current)
                                        s.setVisible(!s.visible);
                                });
                            } else {
                                this.chart.series.forEach(s => {
                                    s.setVisible(s == current);
                                });
                            }

                            return false;
                        },
                    }
                },
                series: {
                    connectNulls: true,
                    animation: false
                }
            },
            series: datasets,
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        legend: {
                            layout: 'horizontal',
                            align: 'center',
                            verticalAlign: 'bottom'
                        }
                    }
                }]
            }
        });

    }

}

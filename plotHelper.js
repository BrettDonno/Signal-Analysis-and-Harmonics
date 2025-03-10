'use strict';

/////////////////////////////////////////////////////////
//            Create Empty plots to plot results       //
/////////////////////////////////////////////////////////

function intiliseEmptyPlots(){
    Plotly.newPlot('Single_Waveforms',[], {title: 'Single Waveform'});
    Plotly.newPlot('Combined_Waveform',[], {title: 'Combined Waveform'});
    Plotly.newPlot('Frequency_Plot',[], {title: 'Frequency Plot'});

}
/////////////////////////////////////////////////////////
//                  Create table                       //
/////////////////////////////////////////////////////////

//deletes the existing table content and create a new table
function createTable(tabDiv, rowHeader, headStyle, rowcolData, cellStyle ){ //rowHeader Nx1 Array [1,2..., N],  col data NxM array [ [1,...N], ..., [1,...N] ]
    
    clearTable(tabDiv);
    
    if (typeof rowcolData !== undefined){
        if(rowHeader.length != rowcolData[0].length)
            throw "Row length does not match col length"
    }
    
    createTablehead(tabDiv, rowHeader, headStyle)
    
    rowcolData.forEach( rowData => {
        appendTable(tabDiv, rowData, cellStyle) 
    })
}

function clearTable(tabDiv){
       if(typeof tabDiv !== undefined){
        tabDiv.innerHTML = '';
    } 
}

function createTablehead( tabDiv, hdrTxt, hdrStyle){
    let hdRow = tabDiv.insertRow(-1);
    
    hdrTxt.forEach( hdtxt => {
        let tabTH = document.createElement("TH");
        
        tabTH.innerHTML = hdtxt;
        tabTH.classList.add(hdrStyle);
        
        hdRow.appendChild(tabTH);
    })
}

function appendTable(tableDiv,rowData, cellStyle){
    let newRow = tableDiv.insertRow(-1);
    rowData.forEach( (cellCont, colIndex) => {
        let newcell = newRow.insertCell(colIndex);
        newcell.classList.add(cellStyle);
        
        let cellContent;
        
        if(typeof cellCont === 'string' || typeof cellCont === 'number' )
            cellContent = document.createTextNode(cellCont);
        else if(cellCont instanceof HTMLElement)
            cellContent = cellCont;
        
        newcell.appendChild(cellContent);
    })
}
/////////////////////////////////////////////////////////
//                  Selector for CC #                  //
/////////////////////////////////////////////////////////
function changeButtonColor(newActiveBut,currentActiveBut){
    if( currentActiveBut != null ){ //another is active
        currentActiveBut.style.background = ''; //deactive color from #008000
        currentActiveBut.parentElement.parentElement.bgColor = '';
    }
    
    newActiveBut.style.background ='#90EE90'//'#008000'
    newActiveBut.parentElement.parentElement.bgColor = '#90EE90';
    
    return newActiveBut
}

function selectActiveCC(CCA_results, selectedCC, T, P, E){
    
    //selecting all the plot elements
        //GSE v ES
    let GSE_plotDiv = document.getElementById('GES_ES_Plot');
    
        // CC plots
    let CC_P_plotDiv = document.getElementById('CCi_P_Plot');
    let CC_E_plotDiv = document.getElementById('CCi_E_Plot');
        // global P-E plots
    let P_plotDiv = document.getElementById('Power_Plot');
    let E_plotDiv = document.getElementById('Energy_Plot');
    
    
    let selectedCC_index = selectedCC - 1; // CC start at # 1 but array index at 0
    
    let T_cc = [ CCA_results.LTStart[ selectedCC_index ], CCA_results.CCTS.Load[ selectedCC_index ][1] ];
    let T_ccstart =  CCA_results.CCTS.Load[ selectedCC_index ][0];
    
    //configuring new x and y ranges for P and E
    let newTrange = T.slice(T_cc[0],T_cc[1]);  
    let startCCT = T[ T_ccstart ];
    
    let newPrange = P.slice( T_cc[0],T_cc[1] ) ;
    //~ let newPrange = [ Math.min.apply(Math, powerDataRange) ,Math.max.apply(Math, powerDataRange) ];
    
    let newErange = E.slice( T_cc[0],T_cc[1] ) ;
    //~ let newErange = [ Math.min.apply(Math, energyDataRange) ,Math.max.apply(Math, energyDataRange) ];
    //~ console.log(newYrange)
    
    let Tsme = [ newTrange[0] , startCCT, newTrange.at(-1) ]
    let Psme = [ newPrange[0], P[ T_ccstart ] ,  newPrange.at(-1) ] //start middle end T
    let Esme = [ newErange[0], E[ T_ccstart ] ,  newErange.at(-1) ] //start middle end T
    
      
    ///////////////////////////
    //        Power plot     //
    //////////////////////////
    
    let PowerLayout = {
        title: 'Power for Crit. Cap. # ' + (selectedCC), 
        showlegend: false,
        yaxis: {title: 'Power (P units)', fixedrange: true},
        xaxis : {title: 'Time (hr)', fixedrange: true},
        shapes: [{
            type: 'line',
            x0: startCCT, y0: 0,
            x1: startCCT, y1: 1,
            xref: 'x',
            yref: 'paper',
            line:{ color: 'rgb(255, 0, 0)', width: 4, dash:'dot'},
        }]
    };
    
    //new P plot
    Plotly.react( CC_P_plotDiv,
        [{ x: newTrange, y: newPrange, hovertemplate: 'P: %{y}' + '<br>' + ' T: %{x}' + '<extra></extra>'}],
        PowerLayout
    );
    
    //adding start, middle and end point markers
    Plotly.addTraces(CC_P_plotDiv, [{
        name:'Start - middle - end',
        y: Psme,
        x: Tsme,
        mode: 'markers',
        marker: {
            size: 20,
            color: ['rgb(100, 75, 75)', 'rgb(255, 0, 0)' ,'rgb(255, 0, 255)'], 
        },
        hovertemplate: 'P: %{y}' + '<br>' + 'T: %{x}' + '<extra></extra>'
    }]);
    
    
    ///////////////////////////
    //       energy plot     //
    //////////////////////////
    let ELayout =  { 
        title: 'Energy for Crit. Cap. # ' + (selectedCC),
        showlegend: false,
        yaxis: {title: 'Power (P units)', fixedrange: true},
        xaxis : {title: 'Time (hr)', fixedrange: true},
        shapes: [{
                type: 'line',
                x0: startCCT, y0: 0,
                x1: startCCT, y1: 1,
                xref: 'x',
                yref: 'paper',
                line:{ color: 'rgb(255, 0, 0)', width: 4, dash:'dot'}
        }],
        hovertemplate: 'E: %{y}' + '<br>' + ' T: %{x}' + '<extra></extra>',
        annotations: [{
            x: T[Math.round((T_ccstart+T_cc[1])/2)] ,//+(newTrange.at(-1) - startCCT)*0.2,
            y: Math.max(...newErange),   //(Math.max(...newErange)+Math.min(...newErange))/2,   //newErange[0]+(newErange.at(-1) - newErange[0])*0.2,
            text: '<b> CC magnitude </b>',
            font: { color: 'red', size: 24 },
            showarrow: false
        },
        {
            ax: startCCT,
            ay: Esme[1],
            arrowside: 'end',
            showarrow: true,
            arrowhead: 3,
            arrowcolor:'red',
            axref: 'x',
            ayref: 'y',
            x: Tsme[2],//+(newTrange.at(-1)-startCCT)*0.5,
            y: Esme[2],
        }
        ]
    };
    // new E plot
    Plotly.react( CC_E_plotDiv,
     [{ x: newTrange, y: newErange, hovertemplate: 'E: %{y}' + '<br>' + ' T: %{x}' + '<extra></extra>'}],
    ELayout
    );
    
    Plotly.addTraces(CC_E_plotDiv, [{
        name:'Start - middle - end',
        y: Esme,
        x: Tsme,
        mode: 'markers',
        marker: { 
            size: 20 ,        
            color: ['rgb(100, 75, 75)', 'rgb(255, 0, 0)' ,'rgb(255, 0, 255)'],            
            //~ colorscale: [[Tsme[0],'rgb(100, 75, 75)'], [Tsme[1], 'rgb(255, 0, 0)'], [Tsme[2],'rgb(255, 0, 255)']],
            },
        hovertemplate: 'E: %{y}' + '<br>' + 'T: %{x}' + '<extra></extra>'
    }]);
     
    
    ///////////////////////////
    //   GSE vs ES marker   //
    //////////////////////////
    
    if( GSE_plotDiv.data.length >1 )
        Plotly.deleteTraces(GSE_plotDiv, 1);
    
    Plotly.addTraces(GSE_plotDiv, [{
        name:'Chosen CC',
        y: [CCA_results.GSE[selectedCC_index]],
        x: [CCA_results.CritCap.Load[selectedCC_index]],
        mode: 'markers',
        marker: {
            size: 20,
            symbol: 'star'
        },
        hovertemplate: 'GSE: %{y:.2f}' + '<br>' + 'CC: %{x:.2f}' + '<extra></extra>'
    }]);
    
    ///////////////////////////
    //   PE gloabl markers  //
    //////////////////////////
    // add additional lines on the energy and power time-series plot (x3, gen start, load start and end)
    
    let PE_sme_lines = { shapes: [{
                type: 'line',
                x0: Tsme[0], y0: 0,
                x1: Tsme[0], y1: 1,
                xref: 'x',
                yref: 'paper',
                line:{ color: 'rgb(100, 75, 75)', width: 4, dash:'dot'}
            },{
                type: 'line',
                x0: Tsme[1], y0: 0,
                x1: Tsme[1], y1: 1,
                xref: 'x',
                yref: 'paper',
                line:{ color: 'rgb(255, 0, 0)', width: 4, dash:'dot'}
            },{
            type: 'line',
            x0: Tsme[2], y0: 0,
            x1: Tsme[2], y1: 1,
            xref: 'x',
            yref: 'paper',
            line:{ color: 'rgb(255, 0, 255)', width: 4, dash:'dot'}
            }
        ]};
    
    Plotly.relayout( P_plotDiv, PE_sme_lines);
    Plotly.relayout( E_plotDiv, PE_sme_lines);
    
    
}



/////////////////////////////////////////////////////////
//         Adding imported Data to Plots               //
/////////////////////////////////////////////////////////

// Redraw each of the plots
function updatePlot( T, P, isEnergy = false, tStep){
    var E;
    
    var CCA_results = CCA(P,isEnergy,tStep);
    
    if(isEnergy){ //allows the raw energy data to be input, note this is the differential of energy e.g. E(t)=integral(P(t)),  delta_E(t)=E(t)-E(t-1) 
        E = P.map((sum => value => sum += value)(0));
        P = P.map( e => e/tStep);
    } else {
     E = CalcNetEnergy( P,tStep )   
    }

    fillCCTable( CCA_results, T, P, E)
    
    
    //adding the three fixed traces ('fixed' for given data)
    Plotly.react('Power_Plot',
        [{x: T ,y: P}], 
        {title: 'Power timeseries', xaxis:{title: 'Time (hr)'},yaxis:{title: 'Power (P Units)'} }
        );

    
    Plotly.react('Energy_Plot',
        [{x: T,y: E}],
        {title: 'Energy timeseries',xaxis:{title: 'Time (hr)'},yaxis:{title: 'Energy (E Units)'},hovermode: 'x unified' }
        );
    
    Plotly.react('GES_ES_Plot',
        [ {name:'GSE v E',x: CCA_results.CritCap.Load,y: CCA_results.GSE , mode: 'lines+markers' , hovertemplate: 'GSE: %{y:.2f}' + '<br>' + '  Es: %{x:.2f}' + '<extra></extra>'} ], 
        {title: 'GSE to Es trade-off', showlegend: false, xaxis:{title: 'Storage Capacity (E Units)'},yaxis:{title: 'GSE (E Units)'}}
        );
    
    
    //~ Plotly.react('CCi_P_Plot',
        //~ [{x: T ,y: P,  hovertemplate: 'P: %{y}' + '<br>' + 'T: %{x}' + '<extra></extra>'}], 
        //~ {title: 'Power for Crit. Cap. # ', showlegend: false , yaxis: {title: 'Power (P units)', fixedrange: true}, xaxis : {title: 'Time (hr)', fixedrange: true} }
        //~ );
        
    //~ Plotly.react('CCi_E_Plot',
        //~ [{x: T, y: E,  hovertemplate: 'E: %{y}' + '<br>' + 'T: %{x}' + '<extra></extra>'  }], 
        //~ {title: 'Energy for Crit. Cap. # ', showlegend: false,  yaxis: {title: 'Energy (E units)', fixedrange: true}, xaxis : {title: 'Time (hr)', fixedrange: true}} 
        //~ );
}


/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////

//some magic here. Maths: Start time -testTime[0] = t0 then a timeseries of N len  with stepsizeZ,  
    // => sum(TimeSeries) = K = t0+ (t0+1*Z) + (t0+2*Z) + ... + (t0+ (N-1)*Z) 
    // Rearrange:  K= t0*N + Z*(1+2+...+(N-1)      => natrual numbers from 1+2+...+N = N*(N+1)/2
    // => K = t0*N + Z*((N-1)*(N-1+1))/2 
//~ var tStep = (T.reduce((a,b) => a+b,0) - T[0]*(T.length)) / (T.length*(T.length-1)/2);

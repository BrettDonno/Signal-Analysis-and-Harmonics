// To do :
//      1) Remove the signal from the freq table. Instead store the data in the plot.
//      2) change the update plot script to accept a type of update, e.g. add plot, remove plot or recalc plot
'use strict';

// math.config({
//     number: 'BigNumber',      // Default type of number:
//                               // 'number' (default), 'BigNumber', or 'Fraction'
//     precision: 64,            // Number of significant digits for BigNumbers
//     relTol: 1e-60,
//     absTol: 1e-63
//   })

const TABLE_HEADERS = ['Name','Delete','Frequency','Magnitude','Phase']
    
const CELL_STYLE = 'tabCell'
const HEAD_STYLE = 'tblHead'


// const Calculate_harmonic_signal = (x_range, magnitude, frequency, phase) => () => x_range.map( x=> magnitude * Math.sin(2*Math.PI*frequency*x + phase*Math.PI/180));
function initilise_table(){
    //Package information to reduce passing
    let TABLE_INFO = {
            FREQ_TABLE: [
                // {'Delete': Button or none for first,'Frequency': Input box,'Magnitude': Input box,'PhaseIn':put box,  'Name':, 'signal':}
                ],
          TABLE_DIV: document.getElementById('tableDataDisplay'),
            // ID of the xranges
                X_RANGE_FIELDS:  {
                    'Start' : document.getElementById('X_range_start'),
                    'Step'  : document.getElementById('X_range_step'),
                    'Stop'  : document.getElementById('X_range_end'),
                },
                X_RANGE: [],
    }

    TABLE_INFO['X_RANGE'] = get_Xrange_from_Fields(TABLE_INFO['X_RANGE_FIELDS']) 
    
    createTablehead(TABLE_INFO['TABLE_DIV'],TABLE_HEADERS , HEAD_STYLE)

    add_ToFreq_Table(TABLE_INFO,TABLE_HEADERS, 'Fundamental')
    add_blur_listener_to_inputs(TABLE_INFO['FREQ_TABLE'][0], TABLE_INFO)
    TABLE_INFO['FREQ_TABLE'][0].Frequency.defaultValue = 50
    TABLE_INFO['FREQ_TABLE'][0].Magnitude.defaultValue = 1
    TABLE_INFO['FREQ_TABLE'][0].Phase.defaultValue = 0
    TABLE_INFO['FREQ_TABLE'][0]['Signal'] = Calculate_harmonic_signal(TABLE_INFO["X_RANGE"], TABLE_INFO['FREQ_TABLE'][0]['Magnitude'].value, TABLE_INFO['FREQ_TABLE'][0]['Frequency'].value, TABLE_INFO['FREQ_TABLE'][0]['Phase'].value)

    updatePlots(TABLE_INFO)
    add_tables_event_listeners(TABLE_INFO)

    add_xRange_listeners(TABLE_INFO) 
}

/////////////////////////////////////////////////
///// Listeners for the Xrange fields     ///////
////////////////////////////////////////////////

function add_xRange_listeners(table_info){
    let xrange_dict = table_info['X_RANGE_FIELDS']

    for (let eachXfield in xrange_dict){
        xrange_dict[eachXfield].addEventListener('blur', event => {
            Update_harmonic_signal(table_info)
            updatePlots(table_info)
        } )   
        xrange_dict[eachXfield].addEventListener('keydown', event => { 
            if (event.key === "Enter") {
                Update_harmonic_signal(table_info)
                updatePlots(table_info )
            }
        } )   
    }
    
}


function get_Xrange_from_Fields(xrange_fields){
    
    return create_range(  parseFloat( xrange_fields['Start'].value),  // It this necessary?
                            parseFloat( xrange_fields['Stop'].value),
                            parseFloat( xrange_fields['Step'].value)
                            )
}
////////////////////////////////////////////////
///// Listeners for the table fields     ///////
////////////////////////////////////////////////
function add_tables_event_listeners(table_info){

    let tableDiv = table_info['TABLE_DIV']

    let freqTable = table_info['FREQ_TABLE']

    //dellete button and add new table
    tableDiv.addEventListener('click',(event)=>{ 
        process_Table_Button(event, table_info)
    });

    //updating field and plot data

    tableDiv.addEventListener('keydown', event =>{
        if (event.key ==="Enter" && event.target.nodeName == "INPUT"){
            let rowFields = [
                            get_index_match_tableRow_dict(event.target, 'Frequency',freqTable),
                            get_index_match_tableRow_dict(event.target, 'Magnitude',freqTable),
                            get_index_match_tableRow_dict(event.target, 'Phase'    ,freqTable),    
                            ].filter(x => x != -1) // e.g. index is found       
            
            calc_and_update(freqTable[rowFields], table_info)
            updatePlots(table_info)
    }})   
}

function add_blur_listener_to_inputs(rowFields, table_info){
    rowFields['Frequency'].addEventListener('blur', event => {calc_and_update(rowFields, table_info)} )    
    rowFields['Magnitude'].addEventListener('blur', event => {calc_and_update(rowFields, table_info)} )    
    rowFields['Phase']    .addEventListener('blur', event => {calc_and_update(rowFields, table_info)} )        
}

function calc_and_update(rowFields, table_info){
    rowFields['Signal'] = Calculate_harmonic_signal(table_info["X_RANGE"], rowFields['Magnitude'].value, rowFields['Frequency'].value, rowFields['Phase'].value)
    updatePlots(table_info)
}

function process_Table_Button(event, table_info){
    let freq_table    = table_info['FREQ_TABLE']

    let tableDiv  = table_info['TABLE_DIV']

    if (event.target.nodeName === 'BUTTON'){
        if(event.target.id === 'table_div_new_row_button_manual'){
            let newRowName = prompt("Enter a name for the frequency")
            let newFreq_Row = newRowName != null ? add_ToFreq_Table(table_info, TABLE_HEADERS,newRowName) : null
            
            if (newFreq_Row != null)
                add_blur_listener_to_inputs(newFreq_Row, table_info)
        }
        else if(event.target.id == 'table_div_new_row_button_harmonic'){
            // let currentFreq =  freq_table.map( e=> { return parseFloat(e['Frequency'].value)})
            
            //get a list of each current harmonic value, so we can take the last value and add the harmonic value to it.
            let currentHarmonics = freq_table.map( eachRow=> { 
                        let intmultiple = (parseFloat(eachRow['Frequency'].value) % parseFloat(freq_table[0]['Frequency'].value))

                        if(intmultiple == 0)
                            return parseFloat(eachRow['Frequency'].value)
                    }).filter(x => x != null)

            
            let newHarmonic = currentHarmonics[0] + currentHarmonics[ currentHarmonics.length -1 ]

            let new_harmonic_name = formatOrdinals(Math.round(newHarmonic/currentHarmonics[0])).concat(" ", " Harmonic")
            let newFreq_Row = add_ToFreq_Table(table_info, TABLE_HEADERS,new_harmonic_name)
            newFreq_Row['Frequency'].value = newHarmonic

            add_blur_listener_to_inputs(newFreq_Row,table_info)
        }
        else{
        let delete_rowKey = get_index_match_tableRow_dict(event.target, 'Delete',freq_table)
        
        freq_table.splice(delete_rowKey,1)
        updated_displayed_table(tableDiv, freq_table,  TABLE_HEADERS, HEAD_STYLE, CELL_STYLE)
        updatePlots(table_info)
        }
      return
    }
    
}


////////////////////////////////////////////////
//          Update commands for listener     //
function updatePlots(table_info){ 
    let freq_table = table_info['FREQ_TABLE']
    let x_range = table_info['X_RANGE'].toArray()
    let upperFreqValue = freq_table.at(-1)['Frequency'].value * 5
    
    
   //Calculating the elements
    let plot_table_values = Array(freq_table.length)
    let Combined_Signal = Array(x_range.length).fill(0)

    for (let each_row_table in freq_table ){
        let eachRowSignal = freq_table[each_row_table]['Signal']()
        // Single waveform
        plot_table_values[each_row_table] =  {x:x_range,  y:eachRowSignal.toArray(), name: freq_table[each_row_table].Name} 
        //combined waveform
        Combined_Signal = math.add(Combined_Signal, eachRowSignal)
    }

    // FFT waveform
    // let [freq, y_fft] = runFFT(x_range, Combined_Signal,'Cooley_Turkey')
    let [freq, y_fft] = runFFT(x_range, Combined_Signal,'Full')
    
    // console.log(math.abs(y_fft).toArray())
    // 'Single_Waveforms'
    Plotly.react( 'Single_Waveforms', plot_table_values, {title: 'Single Waveform'} );

    // 'Combined_Waveform' using the values in plot_table_value
    Plotly.react( 'Combined_Waveform', [{x:x_range,  y:Combined_Signal.toArray()}], {title: 'Combined Waveform'}  );
    
    // 'Frequency_Plot'
    // Plotly.react( 'Frequency_Plot', [{x:freq.toArray(),  y: math.abs(y_fft).toArray()}], {title: 'Combined Waveform'}  );
    Plotly.react( 'Frequency_Plot', [{x:freq.toArray(),  y: math.abs(y_fft)}], {title: 'FFT', xaxis :{range:[0, upperFreqValue] }}  );
    
}

function Update_harmonic_signal(table_info){

    let xrange_dict = table_info['X_RANGE_FIELDS']
    let freq_table = table_info['FREQ_TABLE']

    let x_range = get_Xrange_from_Fields(xrange_dict)
    
    for (let each_row_table in freq_table ){
       
        freq_table[each_row_table]['Signal'] = Calculate_harmonic_signal(
                                                                            x_range, 
                                                                            freq_table[each_row_table].Magnitude.value,
                                                                            freq_table[each_row_table].Frequency.value, 
                                                                            freq_table[each_row_table].Phase.value 
                                                                        )
    }

    table_info['X_RANGE'] = x_range

    return true
    
}


function add_newRow_Button(tableDiv){
    let new_row_button_manual  = document.createElement('Button');
    new_row_button_manual.style.height = '20px';
    new_row_button_manual.style.width  = '60px';
    new_row_button_manual.textContent = "+ manual";
    new_row_button_manual.id = 'table_div_new_row_button_manual'

    
    let new_row_button_harmonic  = document.createElement('Button');
    new_row_button_harmonic.style.height = '20px';
    new_row_button_harmonic.style.width  = '60px';
    new_row_button_harmonic.textContent = "+ harmonic";
    new_row_button_harmonic.id = 'table_div_new_row_button_harmonic'
    
    appendTable(tableDiv, [new_row_button_manual, new_row_button_harmonic],CELL_STYLE)
}



//find which row in our table has a preoprty value match to, e.g. [ {'property':val, 'property2':val2, ..}]  => which value matches ElementMatch.
// This is used to identify what row had the delete button pressed
function get_index_match_tableRow_dict(elementMatch, key_match, table_tested){
    return table_tested.findIndex( e => e[key_match] == elementMatch)
}

function updated_displayed_table(tabDiv,freq_table, rowHeader,headStyle,cellStyle){

    let freq_table_array = Array(freq_table.length)
    for (let eachRow in freq_table){
        let formated_table = TABLE_HEADERS.map(element => freq_table[eachRow][element] )
        freq_table_array[eachRow] = (formated_table) 
    }
    
    createTable(tabDiv, rowHeader, headStyle, freq_table_array, cellStyle )
    add_newRow_Button(tabDiv )

}

function add_ToFreq_Table(table_info,table_headers,row_name) { 

    let tableDiv = table_info['TABLE_DIV']
    let freq_table = table_info['FREQ_TABLE']
    let x_range = table_info['X_RANGE']
    
    let newFreqRow = {}
    let table_number_Inputs = table_headers.filter( X => (X!=="Name") & (X!=="Delete"))
    
    table_number_Inputs.forEach(element => {
        let eachFreq_textinput = document.createElement('Input');
        eachFreq_textinput.setAttribute("type",'number')
        eachFreq_textinput.style.height = '50px';
        eachFreq_textinput.style.width  = '100px';
        eachFreq_textinput.defaultValue = 0;
        newFreqRow[element] = eachFreq_textinput;
    });
    


    // manually set the delete to a button

    if (freq_table.length == 0)
        newFreqRow['Delete'] = "Cannot Delete Fundamental"
    else{
        let delete_Butt  = document.createElement('Button');

        delete_Butt.style.height = '20px';
        delete_Butt.style.width  = '60px';
        
        delete_Butt.textContent = "Delete";
        newFreqRow['Delete'] = delete_Butt
    }
    newFreqRow['Name'] = row_name


    newFreqRow['Signal'] = Calculate_harmonic_signal(x_range, newFreqRow['Magnitude'].value, newFreqRow['Frequency'].value, newFreqRow['Phase'].value)
    freq_table.push(newFreqRow)

    updated_displayed_table(tableDiv,freq_table, table_headers, HEAD_STYLE, CELL_STYLE)
    return newFreqRow
    
}
    

// Example from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules/PluralRules#specifications
function formatOrdinals(n){

    const pr = new Intl.PluralRules("en-US", { type: "ordinal" });

    const suffixes = new Map([
    ["one", "st"],
    ["two", "nd"],
    ["few", "rd"],
    ["other", "th"],
    ]);

    const rule = pr.select(n);
    const suffix = suffixes.get(rule);
    return `${n}${suffix}`;

}

/////////// Calculation functions
const Calculate_harmonic_signal = (x_range, magnitude, frequency, phase) => () => x_range.map( x=> magnitude * Math.sin(2*Math.PI*frequency*x + phase*Math.PI/180));


function create_range(start,stop,step){
    return math.range(start,stop,step)
}
// Defininging Range. Note it is based on floating point steps but we don't care about inprecise results
    // NOTE: must be number  
// function create_range(start,stop,step){
//     // if (step == 0) 
//     //     return []

//     // let results = [start];
//     // let current_step = start;
    
//     // while (current_step < stop){
//     //     current_step = current_step + step;
//     //     results.push(current_step)
//     // }
//     // return results
// }

// cooley-turkey

// Explination for function: https://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm
    // Ignore the s nomenclature, it seems to me to be related to the how arrays are stored in memory and might be related to multi dimensional processing. 
    // E.g.  s=2 if your data is in array of array [[x1,y1],[x2,y2],[x3,y3]]. Extending this to a 3rd variable z1,z2,z3 in the inner arrays has s=3

function FFT_cooley_turkey(yval){
    let N = yval.length
    if(N == 0) return []
    
    if(N==1) return yval
    // zero indexed so technically even are the odd indicies.
    let Odd  = FFT_cooley_turkey(math.filter(yval,(e,i) => i%2 == 0))  // p = x_k
    let Even = FFT_cooley_turkey(math.filter(yval,(e,i) => i%2 !== 0))    // q =exp(...) * x_{k+N/2}

    let X = Array(N)

    let halfN = Math.floor(N/2)

    for(let k = 0; k < halfN; k++ ){
        // p = X[k] // not needed
        let Wk = math.exp( math.multiply(-2*math.PI, math.complex(0,1), k/N)) // q = exp(-2*j*k/N). Signal to colvute at freq k/N)
        let WkEven = math.multiply(Wk, Even[k])
        
        X[k] = math.add( Odd[k], WkEven ) 
        X[k+halfN] = math.subtract( Odd[k], WkEven )
    } 
    // calc freq component
    return X

}


// Create each Xk as the sum of each xn at different exponents - This function is incredible slow
// function FFT_Full(yval){
//     let N = yval.length
//     let n_range = create_range(0,N,1)
//     let Xk = Array(N)
//     for(let k = 0; k < N; k++){
//         let Wk =  math.map(math.multiply(-2*math.PI, math.complex(0,1), k/N, n_range ), math.exp)
//         let xn_wk = math.multiply(Wk, yval)
//         Xk[k] = math.sum(xn_wk)
//     }
//     return Xk
// }

function runFFT(t,y,algorithm){

    let N = y.size()[0]

    let yarr = y.toArray()

    let X; // declar output

    if (algorithm =="Cooley_Turkey"){
        if (! isPowerTwo(N)){
            let padSize = nextPowerTwo(N)-N
            let paddArray = Array(padSize).fill(0)
            // yarr = yarr.concat(Array(padSize).fill(0)) 
            yarr.splice(Math.floor(N/2-paddArray.length/2), 0, ...paddArray)
        }
        X = FFT_cooley_turkey(yarr)
    }
    else{

        // X = FFT_Full(yarr)
        X = math.fft(y).toArray()

    }
       
    // let X = math.fft(yarr)
    // let X = math.fft(y).toArray()
    
    let Fs = 1 / math.mean(math.diff(t)) // sample freq, simply 1/Tstep
    // let Fs = Math.ceil(t.length-1)/(t.at(-1)-t[0]);


    let freq = math.multiply( math.range(0, N/2,1), Fs / (N))
    
    return [freq, X]
}

//
function nextPowerTwo(x){
   return math.pow(2,Math.ceil(Math.log2(x)))
}

// Any multiple of two has a single 1 all right bits are trailing zeros.
// by checking the x-1, it sets all the trailing bits to one, hence if any trailing bit is "on" then it cant be a power
//   Example of why it works.  (4)- (4-1) = 0x100 & 0x011 = 0x000  where as 
// 
function isPowerTwo(x){
    if (x==0) return false
    return ( (x & (x-1)) == 0)
}
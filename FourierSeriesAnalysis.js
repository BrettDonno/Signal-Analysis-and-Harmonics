'use strict';

const TABLE_HEADERS = ['Name','Delete','Frequency','Magnitude','Phase']
    
const CELL_STYLE = 'tabCell'
const HEAD_STYLE = 'tblHead'

function initilise_table(){

    let FREQ_TABLE = [
        // {'Delete': Button or none for first,'Frequency': Input box,'Magnitude': Input box,'Phase':Input box,  'Name':}
        ]        
    const TABLE_DIV = document.getElementById('tableDataDisplay')
    // ID of the xranges
    const X_RANGE_FIELDS = {
        'Start' : document.getElementById('X_range_start'),
        'Step'  : document.getElementById('X_range_step'),
        'Stop'  : document.getElementById('X_range_end'),
    }
    
    createTablehead(TABLE_DIV,TABLE_HEADERS , HEAD_STYLE)

    add_ToFreq_Table(FREQ_TABLE,TABLE_HEADERS, 'Fundamental',TABLE_DIV)
    add_blur_listener_to_inputs(FREQ_TABLE[0], FREQ_TABLE, get_Xrange_from_Fields(X_RANGE_FIELDS))
    FREQ_TABLE[0].Frequency.defaultValue = 50
    FREQ_TABLE[0].Magnitude.defaultValue = 1
    FREQ_TABLE[0].Phase.defaultValue = 0


    let xrange = get_Xrange_from_Fields(X_RANGE_FIELDS) 
    
    updatePlots(FREQ_TABLE, xrange)
    add_tables_event_listeners(FREQ_TABLE,TABLE_DIV, xrange)

    add_xRange_listeners(FREQ_TABLE, X_RANGE_FIELDS)
}

function add_xRange_listeners(freq_table, xrange_fields){

    for (let eachXfield in xrange_fields){
        xrange_fields[eachXfield].addEventListener('blur', event => {updatePlots(freq_table,get_Xrange_from_Fields(xrange_fields))} )   
        xrange_fields[eachXfield].addEventListener('keydown', event => { event.key === "Enter" ? updatePlots(freq_table,get_Xrange_from_Fields(xrange_fields)) : null} )   
    }
    
}

function get_Xrange_from_Fields(xrange_fields){
    let value_dict = {
        'Start' : 0,
        'Step'  : 0.0001,
        'Stop'  : 0.04,
    }
    
    for (let each_key in xrange_fields){
        value_dict[each_key] = parseFloat( xrange_fields[each_key].value);
    }
    
    return value_dict
}

function add_tables_event_listeners(freq_table, tableDiv, Xrange_fields){

    //dellete button and add new table
    tableDiv.addEventListener('click',(event)=>{ 
        process_Table_Button(event, freq_table, tableDiv, Xrange_fields)
    });

    //updating field and plot data

    tableDiv.addEventListener('keydown', event =>{
        if (event.key ==="Enter" && event.target.nodeName == "INPUT"){
             updatePlots(freq_table,Xrange_fields)
    }})   
}

function add_blur_listener_to_inputs(rowFields, freq_table, Xrange_fields){

    rowFields['Frequency'].addEventListener('blur', event => {updatePlots(freq_table,(Xrange_fields))} )    
    rowFields['Magnitude'].addEventListener('blur', event => {updatePlots(freq_table,Xrange_fields)} )    
    rowFields['Phase']    .addEventListener('blur', event => {updatePlots(freq_table,Xrange_fields)} )        
}

function process_Table_Button(event, freq_table, tableDiv,Xrange_fields){

    if (event.target.nodeName === 'BUTTON'){
        if(event.target.id === 'table_div_new_row_button_manual'){
            let newRowName = prompt("Enter a name for the frequency")
            let newFreq_Row = newRowName != null ? add_ToFreq_Table(freq_table, TABLE_HEADERS,newRowName, tableDiv) : null
            
            if (newFreq_Row != null)
                add_blur_listener_to_inputs(newFreq_Row, freq_table, Xrange_fields)
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
            let newFreq_Row = add_ToFreq_Table(freq_table, TABLE_HEADERS,new_harmonic_name, tableDiv)
            newFreq_Row['Frequency'].value = newHarmonic

            add_blur_listener_to_inputs(newFreq_Row, freq_table, Xrange_fields)
        }
        else{
        let delete_rowKey = get_index_match_tableRow_dict(event.target, 'Delete',freq_table)
        
        freq_table.splice(delete_rowKey,1)
        update_table(tableDiv,  TABLE_HEADERS, HEAD_STYLE, freq_table, CELL_STYLE)
        updatePlots(freq_table,Xrange_fields)
        }

      return
    }
    
}

// we don't care about inprecise results
function define_x_range(start,stop,step){
    let results = [start];
    let current_step = start;
    
    while (current_step < stop){
        current_step = current_step + step;
        results.push(current_step)
    }
    return results
}


//single function X_RANGE.map(x=> Math.sin(x))
function updatePlots(freq_table, xrange_dict){
    let x_range = define_x_range(xrange_dict['Start'],  xrange_dict['Stop'], xrange_dict['Step'])
    
    function elementwise_sum(a,b){
        return a.map((e,i) => e+b[i])
    }
    
   //Calculating the elements
    let plot_table_values = []
    let Combined_Signal = Array(x_range.length).fill(0)

    for (let each_row_table in freq_table ){
        let magnitude = freq_table[each_row_table].Magnitude.value
        let frequency = freq_table[each_row_table].Frequency.value
        let phase = freq_table[each_row_table].Phase.value

        let row_y_vals = x_range.map( x=> magnitude * Math.sin(2*Math.PI*frequency*x - phase*Math.PI/180))
        
        // Single waveform
        plot_table_values.push( {x:x_range,  y:row_y_vals, name: freq_table[each_row_table].Name} ) /// This will be slow. Need to store the lists in JS andf only update them when neede

        //combined waveform
        Combined_Signal = elementwise_sum(Combined_Signal, row_y_vals)
    }

    // 'Single_Waveforms'
    Plotly.react( 'Single_Waveforms', plot_table_values, {title: 'Single Waveform'} );

    // 'Combined_Waveform' using the values in plot_table_value
    Plotly.react( 'Combined_Waveform', [{x:x_range,  y:Combined_Signal}], {title: 'Combined Waveform'}  );

    
    
    // 'Frequency_Plot'
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
    for (let rowNum in table_tested){
        if( table_tested[rowNum][key_match] ==elementMatch)
            return rowNum
    }
}



function update_table(tabDiv,rowHeader,headStyle,freq_table,cellStyle){

    let freq_table_array = []
    for (let eachRow in freq_table){
        let formated_table = TABLE_HEADERS.map(element =>{
                return freq_table[eachRow][element]
        })
        freq_table_array.push(formated_table) 
    }
    
    createTable(tabDiv, rowHeader, headStyle, freq_table_array, cellStyle )
    add_newRow_Button(tabDiv,freq_table )

}

function add_ToFreq_Table(freq_table,table_headers,row_name, tableDiv) { 
    
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
        
    // Manually set the name
    newFreqRow['Name'] = row_name
    
    freq_table.push(newFreqRow)
    // appendTable(tableDiv, formated_table,CELL_STYLE)

    update_table(tableDiv,  table_headers, HEAD_STYLE, freq_table, CELL_STYLE)
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
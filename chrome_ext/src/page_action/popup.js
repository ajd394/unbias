chrome.tabs.getSelected(null, function(tab) {
    document.getElementById('currentLink').innerHTML = tab.title;

  
    console.log(tab);
    var socket = io('https://lehighhackers.mybluemix.net/');
    socket.emit('url', { url: tab.url });

    socket.on('resp', function(data){
        console.log("Data = %o", data);
        if (data.status == "ERROR"){            
            $('#mainPopup').text(data.statusInfo);
            return;
        }
        
        
        var author = data.author;
        var concepts = data.concepts;
        var entities = data.entities;

        var body = document.body;
        tbl  = document.createElement('table');
        $(tbl).addClass('pure-table');

        if (author){
            $("#header").append("<div id ='author'>Author: " + author + "</div>");
        }
        
        for(var i = 0; i < 3; i++){
            var tr = tbl.insertRow();
            var td = tr.insertCell();
            td.appendChild(document.createTextNode(concepts[i].text));
            
            var td = tr.insertCell();
            var relevance = '' + (concepts[i].relevance * 100 | 0) + '%';
            var width = '' + ((concepts[i].relevance) * 100 | 0) - 8 + '%';
            $(td).html('<div style = width:' + width + ';>' + relevance + '</div>');
        }

        $(tbl).prepend('<thead> <tr> <th>Concept</th> <th>Relevance</th> </tr> </thead>');
        
        $('#mainPopup').html("<h1>Key Concepts</h1>");
        $('#mainPopup').append(tbl);


        tbl  = document.createElement('table');
        $(tbl).addClass('pure-table');
        
        for(var i = 0; i < 3; i++){
            var tr = tbl.insertRow();
            var td = tr.insertCell();
            td.appendChild(document.createTextNode(entities[i].text));
            
            var td = tr.insertCell();

            var relevance = '' + (entities[i].relevance * 100 | 0) + '%';
            var width = '' + ((entities[i].relevance) * 100 | 0) - 8 + '%';
            $(td).html('<div style = width:' + width + ';>' + relevance + '</div>');
                        
            var td = tr.insertCell();
            td.appendChild(document.createTextNode(entities[i].type));
            
            var td = tr.insertCell();
            td.appendChild(document.createTextNode(entities[i].sentiment.type));
                        
        }
        $(tbl).prepend('<thead> <tr> <th>Entity</th> <th>Relevance</th> <th>Type</th> <th>sentiment</th> </tr> </thead>');
        
        $('#mainPopup').append("<h1>Important Entities</h1>");
        $('#mainPopup').append(tbl);


        tbl  = document.createElement('table');
        $(tbl).addClass('pure-table');
        
        categories = data.toneAnal2.document_tone.tone_categories;

        for(var i = 0; i < 3; i++){
            tones = categories[i].tones;
            var tr = tbl.insertRow();
            
            for (var j = 0; j < 3; j++){        
                    var td = tr.insertCell();
                    var score = '' + (tones[j].score * 100 | 0) + '%';
                    var width = '' + ((tones[j].score) * 100 | 0) + '%';
                    $(td).html('<div style = width:' + width + ';>' + tones[j].tone_id.replace("_big5", "") + " " + score + '</div>');

                  
            }            
        }

        $('#mainPopup').append("<h1>Tones</h1score + >");
        $('#mainPopup').append(tbl);

    });
    
});

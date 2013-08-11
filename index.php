<!DOCTYPE html>
<html>
<head>
    <title>Crop</title>
    <script type="text/javascript" src="jquery1-9.js"></script>
    <script type="text/javascript" src="jquery.jWindowCrop.js"></script>
    <script type="text/javascript" src="jquery-ui-1.10.1.custom.min.js"></script>

    <style type="text/css">
        .jwc_frame {
            border:5px solid black;
        }  
        .jwc_image {
            cursor:move;
        } 
        .jwc_controls {
            background-color:#000;
            width:100%; height:26px;
            opacity:0.6; filter:alpha(opacity=6);
            position:absolute; z-index:100; bottom:0px; left:0px; height: 35px;
        } 
        .jwc_controls span {
            display:block; float:left;
            color:#FFF; font-size:11px;
            margin:7px 0px 0px 5px;
        } 
        .jwc_zoom_in, .jwc_zoom_out {
            display:block; background-color:transparent;
            cursor:pointer;
            width:16px; height:16px;
            float:right; margin:4px 4px 0px 0px;
            text-decoration:none; text-align:center;
            font-size:16px; font-weight:bold; color:#000;
        } 
        .jwc_zoom_in {
            background-image:url(images/round_plus_16.png);
        } 
        .jwc_zoom_out {
            background-image:url(images/round_minus_16.png);
        } 
        .jwc_zoom_in::after {
            content:"";
        } 
        .jwc_zoom_out::after {
            content:"";
        }
    </style>
</head>
<body>
    <!-- THE CROP BOX - Image is hardcoded for now-->
    <img id="crop_image" class="crop_me" alt="" src="images/gary.jpg" />

    <!-- RESULTS for passing crop values to API. Now it is a form but can send this another way if you want -->
    <div id="results">
    <form id="values" name="values" action="index.php" onsubmit="javascript: alert('cropX'+cropX.value + ' cropY'+cropY.value + ' cropWidth'+cropWidth.value + ' cropHeight'+cropHeight.value);">
        <!-- hidden values -->
        <!--
        <input type="hidden" name="cropX" id="cropX" value="" />
        <input type="hidden" name="cropY" id="cropY" value="" />
        <input type="hidden" name="cropWidth" id="cropWidth" value="" />
        <input type="hidden" name="cropHeight" id="cropHeight" value="" />
        -->
        <input type="submit" name="submit" />
    </form>
    </div>

    <!-- SCRIPT for handling changes and getting current values -->
    <script type="text/javascript">
        $(function() {
            $('.crop_me').jWindowCrop({
                targetWidth: 250,
                targetHeight: 250,
                loadingText: 'Load Image',
                onChange: function(result) {
                    // Fille in form values
                    document.getElementById('cropX').value = (result.cropX);
                    document.getElementById('cropY').value = (result.cropY); 
                    document.getElementById('cropWidth').value = (result.cropW); 
                    document.getElementById('cropHeight').value = (result.cropH);

                    $('#cropX').text(result.cropX);
                    $('#cropY').text(result.cropY);
                    $('#cropWidth').text(result.cropW);
                    $('#cropHeight').text(result.cropH);
                }
            });
        });
    </script>

    <div id="results">
        <b>X</b>: <span id="cropX"></span><br />
        <b>Y</b>: <span id="cropY"></span><br />
        <b>W</b>: <span id="cropWidth"></span><br />
        <b>H</b>: <span id="cropHeight"></span><br />
    </div>
</body>
</html>
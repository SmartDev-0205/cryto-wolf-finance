<?php

$json = json_decode(file_get_contents("https://api.bscscan.com/api?module=account&action=txlist&address=0xc5aD46917301b8a426d0C68B53a5CF0DF787cf95&startblock=0&endblock=99999999&page=1&offset=1000&sort=asc&apikey=BFEVGYG9EG2D26ERSFNUJA2HHQNNN49HYQ"));

$unique_address = array();
foreach($json->result as $item) {
    $function = substr($item->input, 0, 10);
    $quantity = base_convert(substr($item->input, 11), 16, 10) / str_pad(1, 19, '0', STR_PAD_RIGHT);
    if($function == '0xd96a094a' && $item->isError == 0) {
        if( ! in_array($item->from, $unique_address)) {
            $unique_address[] = $item->from;
        }
        echo date("Y-m-d", $item->timeStamp).";".$item->from.";".$quantity."\n";
    }
}
echo "TOTAL;HOLDERS;".count($unique_address);
?>

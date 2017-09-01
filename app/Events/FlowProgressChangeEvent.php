<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;

class FlowProgressChangeEvent extends Event
{
    public $model;

    /**
     * FlowProgressChangeEvent constructor.
     * @param $model
     */
    public function __construct($model)
    {
        $this->model = $model;
    }

    /**
     * @return PrivateChannel
     */
    public function broadcastOn()
    {
        return new PrivateChannel('event:flow.progress.change');
    }
}

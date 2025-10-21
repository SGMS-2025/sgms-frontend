import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, MapPin, Plus, Filter } from 'lucide-react';

const CustomerSchedule: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600 mt-2">View and manage your workout sessions</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Book Session
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span>February 2024</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                {day}
              </div>
            ))}
            {Array.from({ length: 28 }, (_, i) => (
              <div
                key={i}
                className={`text-center p-2 rounded-lg ${
                  i === 14
                    ? 'bg-orange-500 text-white'
                    : i === 7 || i === 21
                      ? 'bg-orange-100 text-orange-600'
                      : 'hover:bg-gray-100'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Personal Training</h4>
                  <p className="text-sm text-gray-500">with Mike Johnson</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Feb 15, 2024</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>10:00 AM</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>Studio A</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="default" className="bg-blue-500">
                    Scheduled
                  </Badge>
                  <Button variant="outline" size="sm" className="mt-2">
                    Cancel
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Group Fitness Class</h4>
                  <p className="text-sm text-gray-500">Yoga Flow</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Feb 17, 2024</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>6:00 PM</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>Studio B</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="default" className="bg-green-500">
                    Booked
                  </Badge>
                  <Button variant="outline" size="sm" className="mt-2">
                    Cancel
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Personal Training</h4>
                  <p className="text-sm text-gray-500">with Sarah Wilson</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Feb 20, 2024</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>2:00 PM</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>Studio C</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="default" className="bg-purple-500">
                    Confirmed
                  </Badge>
                  <Button variant="outline" size="sm" className="mt-2">
                    Reschedule
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Personal Training</h4>
                  <p className="text-sm text-gray-500">with Mike Johnson</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Feb 8, 2024</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>10:00 AM</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Completed
                  </Badge>
                  <p className="text-sm text-gray-500 mt-1">60 min</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Group Fitness</h4>
                  <p className="text-sm text-gray-500">HIIT Training</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Feb 5, 2024</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>7:00 PM</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Completed
                  </Badge>
                  <p className="text-sm text-gray-500 mt-1">45 min</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Personal Training</h4>
                  <p className="text-sm text-gray-500">with Sarah Wilson</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Feb 1, 2024</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>2:00 PM</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Completed
                  </Badge>
                  <p className="text-sm text-gray-500 mt-1">60 min</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerSchedule;

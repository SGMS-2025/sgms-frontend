import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Award, Calendar, BarChart3, Zap } from 'lucide-react';

const CustomerProgress: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Progress</h1>
        <p className="text-gray-600 mt-2">Track your fitness journey and achievements</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weight Loss</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">-8.5 lbs</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workouts</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calories Burned</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">12,450</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">5</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span>Weight Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-2">
              {[180, 178, 176, 174, 172, 170, 168, 165].map((weight, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div
                    className="bg-orange-500 rounded-t w-8 transition-all duration-500"
                    style={{ height: `${(weight - 160) * 2}px` }}
                  ></div>
                  <span className="text-xs text-gray-500">{weight}</span>
                  <span className="text-xs text-gray-400">Week {index + 1}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">Starting weight: 180 lbs</p>
              <p className="text-sm text-gray-600">Current weight: 165 lbs</p>
              <p className="text-sm font-semibold text-green-600">Total loss: 15 lbs</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <span>Recent Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">First Month Complete</h4>
                  <p className="text-sm text-gray-500">Completed 30 days of consistent workouts</p>
                  <p className="text-xs text-gray-400">Feb 10, 2024</p>
                </div>
                <Badge variant="default" className="bg-yellow-500">
                  New
                </Badge>
              </div>

              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Weight Loss Goal</h4>
                  <p className="text-sm text-gray-500">Lost 10+ pounds in first month</p>
                  <p className="text-xs text-gray-400">Feb 5, 2024</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Earned
                </Badge>
              </div>

              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Consistency Champion</h4>
                  <p className="text-sm text-gray-500">Worked out 5+ days in a week</p>
                  <p className="text-xs text-gray-400">Jan 28, 2024</p>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  Earned
                </Badge>
              </div>

              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Energy Boost</h4>
                  <p className="text-sm text-gray-500">Burned 1000+ calories in a single workout</p>
                  <p className="text-xs text-gray-400">Jan 20, 2024</p>
                </div>
                <Badge variant="outline" className="text-purple-600 border-purple-600">
                  Earned
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals and Targets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-green-500" />
            <span>Current Goals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Weight Loss</h4>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  On Track
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mb-3">Target: Lose 20 lbs by March 2024</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <p className="text-xs text-gray-500">15 lbs lost, 5 lbs to go</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Workout Frequency</h4>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  On Track
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mb-3">Target: 4 workouts per week</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>This Week</span>
                  <span>3/4</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <p className="text-xs text-gray-500">1 more workout this week</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Strength Training</h4>
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Needs Work
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mb-3">Target: Increase bench press by 20 lbs</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>40%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
                <p className="text-xs text-gray-500">8 lbs gained, 12 lbs to go</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerProgress;
